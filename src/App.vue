<template>
  <div id="app">
    <template v-if="!connected">
      <input
        v-model="roomName"
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
      <h4 v-if="roomNotFound">
        Room doesn't exists
      </h4>

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
        <h4 v-if="wrongPwd">
          Wrong password
        </h4>
      </div>
    </template>
    <template v-else>
      <button @click="leave">
        Leave {{ roomName }}
      </button>
      <h4 v-if="returnedRoomPwd ">
        Admin password: {{ returnedRoomPwd }}
      </h4>
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
      roomName: '',
      returnedRoomPwd: '',
      roomPwd: undefined,
      askForPwd: false,
      wrongPwd: false,
      roomNotFound: false,
      admin: false,
      connected: false,
      drawResult: '',
      list: [],
      used: [],
    };
  },
  watch: {
    roomName() {
      this.resetErrors();
    },
    roomPwd() {
      this.resetErrors();
    },
  },
  mounted() {
    const { room } = this.$route.params;
    if (room) {
      this.roomName = room;
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
      axios.post(`${process.env.VUE_APP_URL}/api/join`, { roomName: this.roomName, roomPwd: this.roomPwd })
        .then((res) => {
          this.admin = res.data.authenticated;
          this.roomName = res.data.roomName;

          // wrong password on recover
          if (this.roomPwd && !this.admin) {
            console.warn('wrong pwd');
            this.wrongPwd = true;
            return;
          }

          this.connected = true;
          console.log('Join room ok');
        })
        .catch((err) => {
          if (err.response.status === 404) {
            console.error('Room not found');
            if (this.roomName.length) {
              this.roomNotFound = true;
            } else if (document.cookie) {
              document.cookie = 'roomName=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
          }
        });
    },
    create() {
      axios.post(`${process.env.VUE_APP_URL}/api/create`, { roomName: this.roomName })
        .then(
          (res) => {
            this.admin = true;
            this.connected = true;
            console.log('Room created pwd: ', res.data);
            this.returnedRoomPwd = res.data;
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
      axios.get(`${process.env.VUE_APP_URL}/api/draw`)
        .then(
          (res) => {
            this.drawResult = res.data;
            if (this.admin) {
              this.$refs.wordsList.incTempUsed();
            }
          },
        )
        .catch((err) => {
          if (err.response.status === 404) {
            this.drawResult = 'The list is empty or every word has been drawn.';
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
    resetErrors() {
      this.wrongPwd = false;
      this.roomNotFound = false;
    },
  },
};
</script>

<style lang="sass">
*
  box-sizing: border-box
  padding: 0
  margin: 0
  outline: none

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
input
  background: none
  font-size: inherit
  padding: 0.2em
  color: inherit

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
