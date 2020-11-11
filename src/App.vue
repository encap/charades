<template>
  <main id="app">
    <div class="loader" :class="{loading: loading}" />

    <div
      v-show="!loading"
      ref="start"
      key="start"
      class="start-container"
    >
      <div class="text-input" @click="focusName">
        <input
          ref="roomNameInput"
          v-model="roomName"
          type="text"
          placeholder="Room Name"
          maxlength="15"
          @input="resetErrors"
          @keydown.enter="create"
        >
        <label />
        <span>
          {{ roomNameMsg }}
        </span>
      </div>
      <div class="buttons">
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

        <div class="recover">
          <transition-group tag="div" :duration="1000" name="pwd-transition">
            <button
              v-show="!askForPwd"
              key="btn"
              class="recover-btn"
              @click="recover"
            >
              <span>
                Recover
              </span>
            </button>

            <div v-show="askForPwd" key="pwd" class="pwd">
              <div class="text-input" @click="focusPwd">
                <input
                  ref="roomPwdInput"
                  v-model="roomPwd"
                  type="text"
                  placeholder="Password"
                  maxlength="3"
                  @input="resetErrors"
                  @keydown.enter="recover"
                >
                <label />
                <span>
                  {{ roomPwdMsg }}
                </span>
              </div>
              <button @click="recover">
                <span>
                  Ok
                </span>
              </button>
            </div>
          </transition-group>
        </div>
      </div>
    </div>

    <div
      v-if="connected"
      key="connected"
      ref="connected"
      class="connected-container"
      :class="{showAdmin: admin && showAdmin, hidden: loading}"
    >
      <div class="top">
        <div class="buttons">
          <button class="leave-btn" @click="leave">
            <span>
              Leave {{ roomName }}
            </span>
          </button>
          <button v-if="admin" class="toggle-admin-btn" @click="toggleAdmin">
            <span>
              {{ showAdmin ? 'Hide admin panel' : 'Show admin panel' }}
            </span>
          </button>
        </div>

        <div v-if="returnedRoomPwd ">
          <h3>
            Admin password: {{ returnedRoomPwd }}
          </h3>
          <p>
            You will need this if you want to manage room from another device.
          </p>
        </div>
      </div>

      <main class="main-container">
        <WordsList v-if="admin" ref="wordsList" class="panel" />

        <DrawWord class="panel" @draw="() => $refs.wordsList ? $refs.wordsList.incTempUsed : null" />
      </main>
    </div>
  </main>
</template>

<script>
import axios from 'axios';

import DrawWord from '@/components/DrawWord.vue';
import WordsList from '@/components/WordsList.vue';

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t));
export default {
  components: {
    DrawWord,
    WordsList,
  },
  data() {
    return {
      roomName: '',
      roomPwd: '',
      returnedRoomPwd: '',
      askForPwd: false,
      roomNameMsg: '',
      roomPwdMsg: '',
      admin: false,
      connected: false,
      showAdmin: true,
      loading: false,
    };
  },
  watch: {
    connected(current) {
      this.$nextTick(async () => {
        const el = current ? this.$refs.connected : this.$refs.start;
        el.scrollIntoView({ behavior: 'smooth' });
        if (this.admin) {
          document.querySelector('.add-one-input').focus({ preventScroll: true });
        }
        if (this.loading) {
          await sleep(600);
          this.loading = false;
        }
      });
    },
  },
  mounted() {
    window.history.scrollRestoration = 'manual';

    const { room } = this.$route.params;
    if (room) {
      this.roomName = room;
      this.$router.replace('/');
      this.loading = true;
      this.join();
    } else if (document.cookie.includes('roomName')) {
      this.loading = true;
      this.join(false);
    } else {
      setTimeout(() => this.focusName, 500);
    }
  },
  methods: {
    focusName() {
      this.$refs.roomNameInput.focus();
    },
    focusPwd() {
      this.$refs.roomPwdInput.focus();
    },
    async validateName() {
      await sleep(500);
      const name = this.roomName;
      if (name.length < 4) {
        this.roomNameMsg = '4 letters minimum';
      } else if (!name.match(/^[a-zA-Z0-9_-]*$/)) {
        this.roomNameMsg = 'only letters, numbers and -_ are allowed';
      } else {
        return true;
      }

      this.loading = false;

      this.focusName();
      return false;
    },
    async validatePwd() {
      await sleep(500);
      const pwd = this.roomPwd;
      if (pwd.length < 3 || !pwd.match(/^[0-9]*$/)) {
        this.roomPwdMsg = '3 digits expected';
      } else {
        return true;
      }

      this.focusPwd();
      return false;
    },
    async join(validate = true) {
      if (validate && !await this.validateName()) {
        return;
      }

      await sleep(400);

      axios.post(`${process.env.VUE_APP_URL}/api/join`, { roomName: this.roomName, roomPwd: this.roomPwd })
        .then((res) => {
          this.admin = res.data.authenticated;
          this.roomName = res.data.roomName;


          // wrong password on recover
          if (this.roomPwd && !this.admin) {
            console.warn('wrong pwd');
            this.roomPwdMsg = 'wrong password';
            this.focusPwd();
            return;
          }

          this.connected = true;

          console.log('Join room ok');
        })
        .catch((err) => {
          if (err.response.status === 404) {
            console.error('Room not found');
            this.loading = false;

            if (this.roomName.length) {
              this.roomNameMsg = 'room doesn\'t exist';
              this.focusName();
            } else if (document.cookie) {
              document.cookie = 'roomName=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
          }
        });
    },
    async create() {
      if (!await this.validateName()) {
        return;
      }
      axios.post(`${process.env.VUE_APP_URL}/api/create`, { roomName: this.roomName })
        .then(
          async (res) => {
            await sleep(500);
            this.admin = true;
            this.connected = true;
            console.log('Room created pwd: ', res.data);
            this.returnedRoomPwd = res.data;
          },
        ).catch((err) => {
          if (err.response.status === 409) {
            console.warn('In use');
            this.roomNameMsg = 'name unavailable';
            this.focusName();
          }
        });
    },
    async recover() {
      if (this.askForPwd && this.roomName) {
        if (await this.validatePwd()) {
          this.join();
        }
      } else if (await this.validateName()) {
        this.askForPwd = true;
      }
    },

    leave() {
      this.connected = false;
      this.admin = false;
      this.roomName = '';
      this.roomPwd = undefined;
    },
    toggleAdmin() {
      console.log('toggle');
    },
    resetErrors() {
      this.roomNameMsg = '';
      this.roomPwdMsg = '';
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
  overflow: hidden

button, input[type="radio"]
  cursor: pointer;

button, input[type="text"]
  text-align: center
</style>

<style scoped lang="sass">
main
  height: 200vh
  width: 100vw

.loader
  position: fixed
  left: 0
  right: 0
  top: 0
  bottom: 0
  display: flex
  justify-content: space-around
  align-items: center

  &:after
    content: ""
    display: block
    width: 2.5em
    height: 2.5em
    border: 4px solid $white
    animation: spin 1s linear infinite
    animation-delay: -0.5s
    opacity: 0
    transition: opacity .1s ease-in-out .1s

  &.loading:after
    transition: none
    opacity: 1


.text-input
  @include text-input

.start-container
  height: 100vh
  padding: 30vh 5vw 10vh
  display: flex
  flex-direction: column
  justify-content: space-around
  margin: 0 auto
  max-width: 40em

  .buttons
    margin-top: 1em
    flex-grow: 1
    display: flex
    flex-direction: column
    justify-content: space-between
    max-height: 15em

    .recover
      position: relative
      height: 3em

    .pwd-transition-enter-active, .pwd-transition-leave-active
      transition: opacity 0.3s ease-in

    .recover-btn
      width: 100%

      &.pwd-transition-leave-to
        opacity: 0

    .pwd
      position: absolute
      top: 0
      width: 100%
      display: flex
      justify-content: space-between
      align-items: flex-end

      &.pwd-transition-enter-active
        transition-delay: 0.3s

      &.pwd-transition-enter-to
        opacity: 1

      &.pwd-transition-enter
        opacity: 0

      button
        margin-left: 3em

      .text-input, button
        width: calc(50% - 1.5em)


  button
    @include big-btn

.connected-container
  position: sticky
  top: 105vh
  height: 100vh
  padding: 1em
  font-size: 1rem
  display: flex
  flex-direction: column
  justify-content: space-between
  transition: opacity .1s ease-in-out

  &.hidden
    transition: none
    opacity: 0

  .top
    display: flex
    align-items: center
    justify-content: space-between

    .buttons
      display: flex

      button
        @include btn
        padding: .5em 2em
        font-weight: 500

        &.leave-btn
          margin-right: 1em
          width: 10em

  .main-container
    padding-top: 2em
    flex-grow: 1
    position: relative
    display: flex
    align-items: center
    justify-content: space-between
    overflow: hidden
    width: calc(100vw - 2em)
    transition: transform 2s ease-in-out

    .panel
      height: 100%

    .panel:last-child
      max-width: 20em


</style>
