<template>
  <div class="draw-container">
    <div class="wrapper">
      <div v-if="admin" class="link">
        <p>
          Invite your friends by sharing this link:
        </p>
        <div class="link-wrapper">
          <input
            ref="joinLink"
            type="text"
            readonly
            :value="joinUrl"
          >
          <label :class="{selected: copied}" />
        </div>

        <button ref="copyBtn" class="copy-btn" @click="copy">
          <span>
            {{ copied ? 'Copied' : 'Copy' }}
          </span>
        </button>
      </div>

      <div class="draw">
        <button ref="drawBtn" class="draw-btn" @click="draw">
          <span>
            Draw
          </span>
        </button>
        <div class="under-btn-wrapper">
          <h1 v-show="drawResults" class="draw-result">
            {{ drawResults }}
          </h1>
          <h3 v-if="admin && drawResults.length === 0">
            Players will only see this button
          </h3>
          <h4 v-show="drawResults === false" class="error">
            The list is empty or every word has been drawn.
          </h4>
        </div>
      </div>
      <div class="dummy" />
    </div>
  </div>
</template>
<script>
import axios from 'axios';

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t));
// const sleep = () => new Promise((resolve) => setTimeout(resolve, 50));

export default {
  name: 'DrawWord',
  props: {
    admin: {
      type: Boolean,
    },
    roomName: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      drawResults: '',
      copied: false,
    };
  },
  computed: {
    joinUrl() {
      return `${window.location.host}/${this.roomName}`;
    },
  },
  methods: {
    async draw() {
      await sleep(1000);
      axios.get(`${process.env.VUE_APP_URL}/api/draw`)
        .then(
          (res) => {
            this.drawResults = res.data;
            this.$emit('draw');
            this.$refs.drawBtn.blur();
          },
        )
        .catch((err) => {
          if (err.response.status === 404) {
            this.drawResults = false;
          } else {
            this.drawResults = 'Internal error';
          }
          this.$refs.drawBtn.blur();
        });
    },
    async copy() {
      this.$refs.joinLink.select();
      this.copied = true;
      this.$refs.copyBtn.focus();
      document.execCommand('copy');
      await sleep(300);
      this.$refs.joinLink.select();
      await sleep(4000);
      this.copied = false;
      this.$refs.joinLink.blur();
    },
  },
};
</script>

<style lang="sass" scoped>
.draw-container
  position: relative
  width: 100%

.wrapper
  height: 100%
  width: 100%
  display: flex
  flex-direction: column
  justify-content: space-evenly
  align-items: center
  position: relative
  text-align: center
  word-wrap: break-word

.link
  display: flex
  flex-wrap: wrap
  position: relative
  align-items: flex-end
  justify-content: space-evenly
  max-width: 30em
  margin-bottom: 3em
  p
    min-width: 100%
    margin-bottom: 0.5em

  .link-wrapper
    @include text-input


  p, .link-wrapper input[type="text"]
    max-width: none
    font-size: 1.1em
    text-align: center


  .copy-btn
    @include btn($blue)

  .copy-btn, .link-wrapper
    margin-left: 1em

.draw
  display: flex
  flex-direction: column
  justify-content: flex-start
  align-items: center
  width: 100%

.draw-btn
  @include big-btn($blue)
  width: 100%
  max-width: 700px

.under-btn-wrapper
  margin-top: 2em
  min-height: 4em


  .draw-result
    font-size: 3rem

.dummy
  opacity: 0

</style>
