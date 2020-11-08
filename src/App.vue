<template>
  <main id="app">
    <div
      ref="start"
      key="start"
      class="start-container"
    >
      <div class="text-input">
        <input
          v-model="roomName"
          type="text"
          placeholder="room name"
          @keydown.enter="create"
        >
        <label />
      </div>
      <button @click="create">
        <span>
          Create

        </span>
      </button>
      <button @click="join">
        <span>
          Join

        </span>
      </button>
      <h4 v-if="roomNotFound">
        Room doesn't exists
      </h4>

      <button @click="recover">
        <span>
          Recover
        </span>
      </button>

      <div v-if="askForPwd" class="pwd">
        <div class="text-input">
          <input
            v-model="roomPwd"
            type="text"
            placeholder="password"
            @keydown.enter="recover"
          >
          <label />
        </div>
        <h4 v-if="wrongPwd">
          Wrong password
        </h4>
        <button @click="recover">
          <span>
            Ok
          </span>
        </button>
      </div>
    </div>
    <transition :duration="1000">
      <div
        v-if="connected"
        key="connected"
        ref="connected"
        class="connected-container"
      >
        <button @click="leave">
          <span>
            Leave {{ roomName }}
          </span>
        </button>
        <h4 v-if="returnedRoomPwd ">
          Admin password: {{ returnedRoomPwd }}
        </h4>


        <DrawWord @draw="() => $refs.wordsList ? $refs.wordsList.incTempUsed : null" />

        <WordsList v-if="admin" ref="wordsList" />
      </div>
    </transition>
  </main>
</template>

<script>
import axios from 'axios';

import DrawWord from '@/components/DrawWord.vue';
import WordsList from '@/components/WordsList.vue';

export default {
  components: {
    DrawWord,
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
    };
  },
  watch: {
    roomName() {
      this.resetErrors();
    },
    roomPwd() {
      this.resetErrors();
    },
    connected(current) {
      this.$nextTick(() => {
        const el = current ? this.$refs.connected : this.$refs.start;
        console.log(el);
        el.scrollIntoView({ behavior: 'smooth' });
      });
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
*, ::before, ::after
  box-sizing: border-box
  padding: 0
  margin: 0
  outline: none

body
  font-family: Arial, Helvetica, sans-serif
  font-size: 1.2rem
  color: white
  background: radial-gradient(ellipse at center, $bg-color, darken($bg-color, 2%))
  display: flex
  justify-content: space-around
  align-items: center
  height: 200vh
  width: 100vw

button, input[type="radio"]
  cursor: pointer;

button, input[type="text"]
  text-align: center
</style>

<style scoped lang="sass">
main
  height: 200vh
  width: 100vw

.start-container
  height: 100vh
  padding: 5%
  display: flex
  flex-direction: column
  justify-content: space-around
  margin: 0 auto
  max-width: 500px

  button
    @include big-btn


.connected-container
  position: sticky
  top: 105vh
  padding: 20vh 10vw
  height: 100vh
  display: flex
  flex-direction: column
  justify-content: space-around

.text-input
  @include text-input

</style>
