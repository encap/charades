<template>
  <div class="draw-container">
    <button class="drawBtn" @click="draw">
      Draw
    </button>
    <h1 class="drawResult">
      {{ drawResult }}
    </h1>
  </div>
</template>
<script>
import axios from 'axios';

export default {
  name: 'DrawWord',
  data() {
    return {
      drawResult: '',
    };
  },
  methods: {
    draw() {
      axios.get(`${process.env.VUE_APP_URL}/api/draw`)
        .then(
          (res) => {
            this.drawResult = res.data;
            this.$emit('draw');
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
  },
};
</script>

<style lang="sass" scoped>
.draw
  margin: 1em 0

.drawBtn
  @include big-btn

.drawResult
  text-align: center
  padding: 0.2em
  border: 2px solid green
</style>
