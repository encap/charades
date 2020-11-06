const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { MongoClient } = require('mongodb');

const app = express();
const http = require('http').Server(app);

const PATH = path.join(__dirname, '../dist');
const PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(cookieParser());
// redirect to https
if (PROD) {
  app.use((req, res, next) => {
    if (req.protocol === 'http') {
      console.log('Redirecting client to https');
      res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    } else {
      next();
    }
  });
}

app.use(bodyParser.json());

const dbPwd = 'a8aCoEew6UosPBOs';
const uri = `mongodb+srv://dbUser:${dbPwd}@cluster0.lgvkp.mongodb.net/main?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true });

client.connect(() => {
  const db = client.db('main');

  const doesRoomExist = (roomName) => db.listCollections()
    .toArray()
    .then((collections) => collections.some((collection) => collection.name === roomName));

  const auth = async () => true;

  app.post('/api/join', async (req, res) => {
    const roomName = req.body.roomName || req.cookies.roomName;

    res.cookie('roomName', roomName, { maxAge: 2592000 });

    if (await doesRoomExist(roomName)) {
      const roomPwd = req.body.roomPwd || req.cookies.roomPwd;
      console.log(roomPwd);
      let authenticated = false;
      if (roomPwd && await auth(roomName, roomPwd)) {
        authenticated = true;
        res.cookie('roomPwd', roomPwd, { maxAge: 2592000 });
      }
      res.status(200).send({ authenticated });
    } else {
      res.status(404).send('Room not found');
    }
  });

  app.post('/api/create', async (req, res) => {
    const room = {
      name: req.body.name,
      pwd: Math.round(Math.random() * 1000),
      list: [],
    };

    if (await doesRoomExist(room.name)) {
      res.status(409).end();
      return;
    }

    db.collection(room.name).insertOne(room).then(() => {
      res.cookie('roomName', room.name, { maxAge: 2592000 });
      res.cookie('roomPwd', room.pwd, { maxAge: 2592000 });
      res.status(200).send(room.pwd.toString());
    }).catch((err) => {
      console.error(err);
      res.status(500).end();
    });
  });

  app.post('/api/list', (req, res) => {
    const { roomName } = req.cookies;
    console.log(roomName);
    const { list } = req.body;
    const { separatorText } = req.body;


    db.collection(roomName).updateOne({},
      {
        $set: {
          list,
          separatorText,
        },
      })
      .then(() => {
        res.status(200).end();
      }).catch((err) => {
        console.error(err);
        res.status(500).end();
      });
  });

  app.get('/api/list', async (req, res) => {
    const { roomName } = req.cookies;
    const collection = await db.collection(roomName).findOne({});
    const data = {
      list: collection.list,
      separatorText: collection.separatorText,
    };

    res.send(data);
  });

  app.post('/api/reset', (req, res) => {
    const { roomName } = req.cookies;

    db.collection(roomName).updateOne({},
      {
        $set: {
          used: [],
        },
      })
      .then(() => {
        res.status(200).end();
      }).catch((err) => {
        console.error(err);
        res.status(500).end();
      });
  });

  const getUsed = (roomName) => db.collection(roomName)
    .findOne({}, { projection: { used: 1, _id: 0 } })
    .then(({ used }) => used);


  app.get('/api/draw', (req, res) => {
    const { roomName, roomPwd } = req.cookies;

    const wasUsed = (word) => db.collection(roomName)
      .find({ used: word }, { projection: { _id: 1 } })
      .count();
    const getRandom = () => {
      const cursor = db.collection(roomName).aggregate(
        [
          { $unwind: '$list' },
          { $sample: { size: 1 } },
          { $project: { list: 1, _id: 0 } },
        ], { cursor: { batchSize: 1 } },
      );

      cursor.toArray().then(async ([results]) => {
        if (results) {
          const data = {
            result: results.list.toString(),
          };

          if (await wasUsed(data.result)) {
            console.log(data.result);
            getRandom();
            return;
          }
          await db.collection(roomName).updateOne({},
            {
              $push: {
                used: data.result,
              },
            });
          if (await auth(roomName, roomPwd)) {
            data.used = await getUsed(roomName);
          }
          res.send(data);
        } else {
          res.sendStatus(404);
        }
      });
    };

    getRandom();
  });

  app.get('/api/used', async (req, res) => {
    const used = await getUsed(req.cookies.roomName);
    res.status(200).send(used);
  });


  app.use((req, res, next) => {
    const match = req.originalUrl.match(/\.\w+$/);
    const ext = match ? match[0][0] : '';
    if ((req.method === 'GET' || req.method === 'HEAD') && (ext === '' || ext === 'html')) {
      res.sendFile('index.html', { root: PATH });
    } else {
      next();
    }
  });

  app.use(express.static(PATH));
});


const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', `Server listening on port ${PORT}!`);
});
