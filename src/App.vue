<template>
  <main id="app">
    <div class="loader" :class="{loading: loading}" />
    <h4 class="author">
      Made by Łukasz Wielgus for Lovely Sister
    </h4>

    <div
      v-show="!loading"
      ref="start"
      key="start"
      class="start-container"
    >
      <img src="../public/logo.png" alt="logo" class="logo">
      <!-- <div class="logo">
        <h1>
          MEMORY
        </h1>
        <h2>MULTIPLAYER EDITION</h2>
      </div> -->

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
      :class="{hidden: loading}"
    >
      <div class="top">
        <div class="buttons">
          <button class="leave-btn" @click="leave">
            <span>
              Leave {{ roomName }}
            </span>
          </button>
          <button
            v-if="admin"
            ref="toggleAdmin"
            class="toggle-admin-btn"
            @click="toggleAdmin"
          >
            <span>
              {{ hideList ? 'Show admin panel' : 'Hide admin panel' }}
            </span>
          </button>
        </div>

        <template v-if="admin">
          <div v-if="listLength !== null" class="used">
            <h2 class="used-count">
              Used: {{ usedCount + tempUsed }} / {{ listLength }}
            </h2>

            <button ref="resetUsed" @click="resetUsed">
              <span>
                Reset Used
              </span>
            </button>
          </div>


          <div v-if="returnedRoomPwd && !listLength">
            <h3>
              Admin password: {{ returnedRoomPwd }}
            </h3>
            <p>
              You will need this if you want to manage room from another device.
            </p>
          </div>
        </template>
      </div>

      <main class="main-container" :class="{'hide-list': hideList}">
        <!-- <transition name="toggle-admin" :duration="100000"> -->
        <WordsList
          v-if="admin"

          ref="wordsList"
          class="panel words-list"
          @used="updateUsed"
        />
        <!-- </transition> -->

        <DrawWord
          class="panel draw-component"
          :admin="admin"
          :room-name="roomName"
          @draw="tempUsed += 1"
        />
      </main>
    </div>
  </main>
</template>

<script>
import axios from 'axios';

import DrawWord from '@/components/DrawWord.vue';
import WordsList from '@/components/WordsList.vue';

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t));
// const sleep = () => new Promise((resolve) => setTimeout(resolve, 50));
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
      loading: false,
      tempUsed: 0,
      usedCount: 0,
      listLength: null,
      hideList: false,
    };
  },
  watch: {
    connected(current) {
      this.$nextTick(async () => {
        window.scrollTo({
          top: current ? document.body.scrollHeight : 0,
          behavior: 'smooth',
        });

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

    window.addEventListener('resize', () => {
      if (this.connected) {
        this.$refs.connected.scrollIntoView({ behavior: 'auto' });
      }
    });
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
    resetErrors() {
      this.roomNameMsg = '';
      this.roomPwdMsg = '';
    },
    leave() {
      this.connected = false;
      this.admin = false;
      this.roomName = '';
      this.roomPwd = undefined;
    },
    async toggleAdmin() {
      this.hideList = !this.hideList;
      await sleep(1000);
      this.$refs.toggleAdmin.blur();
    },
    updateUsed(data) {
      this.tempUsed = 0;
      this.usedCount = data.usedCount;
      this.listLength = data.listLength;
    },
    async resetUsed() {
      this.$refs.wordsList.resetUsed();
      await sleep(800);
      this.$refs.resetUsed.blur();
    },
  },
};
</script>

<style lang="sass">
// @font-face
//   font-family: 'Minecraft'
//   src: url('../public/minecraft-font/minecraft.ttf') format('truetype')

// @font-face
//   font-family: 'Munro'
//   src: url('../public/munro-font/munro.ttf') format('truetype')

*, ::before, ::after
  box-sizing: border-box
  padding: 0
  margin: 0
  outline: none

::selection
  background-color: darken(rgba($blue, 0.99), 5%)

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
  cursor: pointer


button, input[type="text"]
  text-align: center
</style>

<style scoped lang="sass">
main
  height: 200vh
  width: 100vw

.author
  position: fixed
  bottom: 0.5em
  right: 0.5em
  font-weight: normal
  font-size: 0.7em
  color: $grey

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


.start-container
  height: 100vh
  padding: 10vh 5vw
  display: flex
  flex-direction: column
  justify-content: space-around
  margin: 0 auto
  max-width: 40em

  .logo
    width: 100%
    transform: translateX(0.8rem)

  // .logo
  //   margin: 0 auto
  //   width: min-content
  //   h1
  //     font-family: 'Minecraft', Arial, sans-serif

  //     font-size: 7rem
  //     letter-spacing: 0.1em
  //     text-align: center
  //     // color: $white


  //   h2
  //     transform: translateX(1em)
  //     margin-top: 0.2em
  //     text-align: right
  //     font-family: 'Munro', Arial, sans-serif
  //     letter-spacing: 0.05em
  //     font-size: 1.5rem

  .text-input
    @include text-input

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
  top: 100vh
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
    flex-wrap: wrap

    .buttons, .used
      display: inline-flex
      align-items: center

      button
        @include btn
        padding: .5em 2em
        font-weight: 500

      .leave-btn, .used-count
        margin-right: 2em
        width: 10em

      .used-count
        text-align: right


  .main-container
    padding-top: 2em
    flex-grow: 1
    position: relative
    display: flex
    align-items: center
    justify-content: space-around
    overflow-y: hidden
    width: calc(100vw - 2em)

    .panel
      height: 100%
      flex-basis: 0
      transition: flex-basis 1s ease-out, opacity 0.4s linear 0s

    .words-list
      margin-right: 8vw
      flex-grow: 3
      max-width: 60em
      overflow: hidden

    .draw-component
      flex-grow: 1
      flex-basis: 20em

    &.hide-list
      .words-list
        transition: flex-basis 1s ease-in, opacity 0.3s linear 0.3s
        opacity: 0
        flex-basis: 0

      .draw-component
        flex-basis: calc(100vw - 2em)

</style>
