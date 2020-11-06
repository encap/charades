<template>
  <div id="app">
    <input v-model="name" type="text" placeholder="room name">
    <button @click="create">
      Create
    </button>
    <button @click="join">
      Join
    </button>
    <button @click="recover">
      Recover
    </button>
    <button @click="resetUsed">
      Reset Used
    </button>
    <button class="draw" @click="draw">
      Draw
    </button>
    <WordsList v-if="admin" />
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
      name: 'test',
      admin: false,
      drawResult: '',
      list: [],
      used: [],
    };
  },
  mounted() {
    console.log(this.$route.params);
    const { room } = this.$route.params;
    if (room) {
      this.name = room;
      this.join();
      this.router.push('/');
    }
  },
  methods: {
    join() {
      axios.post(`http://localhost:3000/api/join/${this.name}`)
        .then(() => {
          this.admin = false;
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
            console.log('Room created pwd: ', res.data);
          },
        ).catch((err) => {
          if (err.response.status === 409) {
            console.warn('In use');
          }
        });
    },
    async recover() {
      if (await this.join()) {
        this.askForPin = true;
      } else {
        this.roomNotFound = true;
      }
    },
    auth() {
      axios.post('http://localhost:3000/api/auth', { pwd: this.pwd })
        .then(
          (res) => {
            this.wrongPwd = false;
            this.admin = true;
            console.log(res.data);
          },
        )
        .catch((err) => {
          console.log(err.response.status);
          this.wrongPwd = true;
        });
    },
    draw() {
      axios.get('http://localhost:3000/api/draw')
        .then(
          (res) => {
            console.log(res.data);
          },
        );
    },
    resetUsed() {
      axios.post('http://localhost:3000/api/reset')
        .then(
          () => {
            console.log('Reset ok');
          },
        );
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

button
  background: white
  border: 2px solid grey
  padding: 5px 10px
  margin: 10px
</style>

<style scoped lang="sass">
.draw
  border-color: red
</style>
