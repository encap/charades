const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

require('dotenv').config();
const { MongoClient } = require('mongodb');

const app = express();
const http = require('http').Server(app);

const PATH = path.join(__dirname, '/dist');
const PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(cookieParser());
// redirect to https
app.enable('trust proxy'); // trust heroku and cloudflare
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


const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(() => {
  const db = client.db('main');

  const doesRoomExist = (roomName) => db.listCollections()
    .toArray()
    .then((collections) => collections.some((collection) => collection.name === roomName));

  const auth = (roomName, roomPwd) => db.collection(roomName)
    .findOne({ pwd: roomPwd.toString() }, { projection: { pwd: 1, _id: 0 } })
    .then((data) => data !== null);

  app.post('/api/join', async (req, res) => {
    const roomName = req.body.roomName || req.cookies.roomName;

    if (await doesRoomExist(roomName)) {
      const roomPwd = req.body.roomPwd || req.cookies.roomPwd;
      let authenticated = false;

      if (roomPwd) {
        authenticated = await auth(roomName, roomPwd);
        if (authenticated) {
          res.cookie('roomPwd', roomPwd, { maxAge: 2592000 });
          res.cookie('roomName', roomName, { maxAge: 2592000 });
        }
      } else {
        res.cookie('roomName', roomName, { maxAge: 2592000 });
      }


      res.status(200).send({ roomName, authenticated });
    } else {
      res.status(404).send('Room not found');
    }
  });

  app.post('/api/create', async (req, res) => {
    const room = {
      name: req.body.roomName,
      pwd: Math.floor(100 + (Math.random() * 900)).toString(),
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
    const { list, overWrite } = req.body;
    const { separatorText } = req.body;

    const convertedList = list.map((text) => ({ text }));

    let operation = {
      $push: {
        list: {
          $each: convertedList,
        },
      },
      $set: {
        separatorText,
      },
    };
    if (overWrite) {
      operation = {
        $set: {
          list: convertedList,
          separatorText,
        },
      };
    }
    db.collection(roomName).updateOne({}, operation)
      .then(() => {
        res.status(200).end();
      }).catch((err) => {
        console.error(err);
        res.status(500).end();
      });
  });

  app.get('/api/list', async (req, res) => {
    const { roomName } = req.cookies;
    const data = await db.collection(roomName).findOne({}, { projection: { name: 0, pwd: 0, _id: 0 } });

    res.send(data);
  });

  app.get('/api/draw', (req, res) => {
    const { roomName } = req.cookies;


    const cursor = db.collection(roomName).aggregate(
      [
        { $unwind: '$list' },
        {
          $match: {
            'list.used': { $exists: false },
          },
        },
        { $sample: { size: 1 } },
        { $project: { list: 1, _id: 1 } },
      ],
    );

    cursor.toArray().then(([data]) => {
      if (data) {
        const { list } = data;
        const text = list.text.toString();

        db.collection(roomName).updateOne(
          // {
          // $and: [
          // {
          //   'list.text': {
          //     $eq: text,
          //   },
          // },
          {
            list: {
              $elemMatch: {
                text,
                used: { $exists: false },
              },
            },
          // ],
          },
          {
            $inc: {
              'list.$.used': 1,
            },
          },
        );

        res.status(200).send(text);
      } else {
        res.sendStatus(404);
      }
    });
  });

  app.get('/api/used', async (req, res) => {
    const { roomName } = req.cookies;

    const [results] = await db.collection(roomName).aggregate(
      [
        {
          $project: {
            used: {
              $map: {
                input: '$list',
                as: 'item',
                in: '$$item.used',
              },
            },
            _id: 0,
          },
        },
      ],
    ).toArray();
    res.status(200).send(results.used);
  });

  app.post('/api/reset', (req, res) => {
    const { roomName } = req.cookies;

    db.collection(roomName).updateMany({},
      {
        $unset: { 'list.$[].used': undefined },
      })
      .then(() => {
        res.status(200).end();
      }).catch((err) => {
        console.error(err);
        res.status(500).end();
      });
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
