<template>
  <div class="draw-container">
    <div class="wrapper">
      <button ref="drawBtn" class="draw-btn" @click="draw">
        <span>
          Draw
        </span>
      </button>
      <h1 v-show="drawResults" class="draw-result">
        {{ drawResults }}
      </h1>
      <h3 v-if="admin && !drawResults">
        Players will only see this button
      </h3>
      <h4 v-show="drawResults === false" class="error">
        The list is empty or every word has been drawn.
      </h4>
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
  },
  data() {
    return {
      drawResults: '',
    };
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
  },
};
</script>

<style lang="sass" scoped>
.draw-container
  position: relative

.wrapper
  height: 100%
  width: 100%
  padding: 20em 0
  display: flex
  flex-direction: column
  justify-content: space-evenly
  align-items: center
  position: relative
  text-align: center
  word-wrap: break-word

.draw-btn
  @include big-btn($blue)
  width: 100%
  max-width: 700px

.draw-result
  font-size: 3rem

</style>
