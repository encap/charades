<template>
  <div id="app">
    <template v-if="!connected">
      <input
        v-model="name"
        type="text"
        placeholder="room name"
        @keydown.enter="create"
      >
      <button @click="create">
        Create
      </button>
      <button @click="join">
        Join
      </button>

      <button @click="recover">
        Recover
      </button>

      <div v-if="askForPwd" class="pwd">
        <input
          v-model="roomPwd"
          type="text"
          placeholder="password"
          @keydown.enter="recover"
        >
      </div>
    </template>
    <template v-else>
      <button @click="leave">
        Leave room
      </button>
      <div class="draw">
        <button class="drawBtn" @click="draw">
          Draw
        </button>
        <h1 class="drawResult">
          {{ drawResult }}
        </h1>
      </div>


      <WordsList v-if="admin" ref="wordsList" />
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import WordsList from '@/components/WordsList.vue';

export default {
  components: {
    WordsList,
  },
  data() {
    return {
      name: '',
      roomPwd: undefined,
      askForPwd: false,
      admin: false,
      connected: false,
      drawResult: '',
      list: [],
      used: [],
    };
  },
  mounted() {
    const { room } = this.$route.params;
    if (room) {
      this.name = room;
    }
    if (room || document.cookie) {
      this.join();
      if (room) {
        this.$router.replace('/');
      }
    }
  },
  methods: {
    join() {
      axios.post('http://localhost:3000/api/join', { roomName: this.name, roomPwd: this.roomPwd })
        .then((res) => {
          this.admin = res.data.authenticated;

          // wrong password on recover
          if (this.roomPwd && !this.admin) {
            console.warn('wrong pwd');
            this.wrondPwd = true;
          }

          this.connected = true;
          console.log('Join room ok');
          return true;
        })
        .catch((err) => {
          if (err.response.status === 404) {
            console.error('Room not found');
            this.roomNotFound = true;
            return false;
          }
        });
    },
    create() {
      axios.post('http://localhost:3000/api/create', { name: this.name })
        .then(
          (res) => {
            this.admin = true;
            this.connected = true;
            console.log('Room created pwd: ', res.data);
          },
        ).catch((err) => {
          if (err.response.status === 409) {
            console.warn('In use');
          }
        });
    },
    recover() {
      if (this.roomPwd) {
        this.join();
      } else {
        this.askForPwd = true;
      }
    },
    draw() {
      axios.get('http://localhost:3000/api/draw')
        .then(
          (res) => {
            console.log(res.data);
            this.drawResult = res.data.result;
            if (this.admin) {
              this.$refs.wordsList.setUsed(res.data.used);
            }
          },
        )
        .catch((err) => {
          if (err.response.status === 404) {
            this.drawResult = 'List is empty';
          } else {
            this.drawResult = 'Internal error';
          }
        });
    },
    leave() {
      this.connected = false;
      this.admin = false;
      this.roomName = '';
      this.roomPwd = undefined;
    },

  },
};
</script>

<style lang="sass">
*
  box-sizing: border-box
  padding: 0
  margin: 0

body
  padding: 5% 10%
  font-family: Arial, Helvetica, sans-serif
  font-size: 1.4rem
  color: white
  background: #222


button
  background: white
  border: 2px solid grey
  padding: 5px 10px
  margin: 10px
</style>

<style scoped lang="sass">
.draw
  margin: 1em 0

.drawBtn
  padding: 2em 5em
  border-radius: 3em

.drawResult
  text-align: center
  padding: 0.2em
  border: 2px solid red
  border-radius: 1em

</style>
