<template>
  <div class="draw-container">
    <button ref="drawBtn" class="draw-btn" @click="draw">
      <span>
        Draw
      </span>
    </button>
    <h1 class="draw-result">
      {{ drawResult }}
    </h1>
  </div>
</template>
<script>
import axios from 'axios';

const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t));

export default {
  name: 'DrawWord',
  data() {
    return {
      drawResult: '',
    };
  },
  methods: {
    async draw() {
      await sleep(1000);
      axios.get(`${process.env.VUE_APP_URL}/api/draw`)
        .then(
          (res) => {
            this.drawResult = res.data;
            this.$emit('draw');
            this.$refs.drawBtn.blur();
          },
        )
        .catch((err) => {
          if (err.response.status === 404) {
            this.drawResult = 'The list is empty or every word has been drawn.';
          } else {
            this.drawResult = 'Internal error';
          }
          this.$refs.drawBtn.blur();
        });
    },
  },
};
</script>

<style lang="sass" scoped>
.draw
  margin: 1em 0

.draw-btn
  @include big-btn
  width: 10em


.draw-result
  text-align: center
  padding: 0.2em
  margin-top: 3em
</style>
