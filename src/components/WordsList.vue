<template>
  <div class="container">
    <div v-if="list.length" class="used">
      <h2>Used: {{ used.length }} / {{ list.length }}</h2>

      <button @click="resetUsed">
        Reset Used
      </button>
    </div>
    <button class="hide" @click="() => hideList = !hideList">
      {{ hideList ? 'Show List' : 'Hide List' }}
    </button>
    <div v-show="!hideList" class="list">
      <div class="separator">
        <label v-for="(separator, index) in separatorOptions" :key="index">
          <input
            v-model="separatorText"
            type="radio"
            :value="separator[0]"
            :name="separator[0]"
          >
          <span>{{ separator[1] }}</span>
        </label>
      </div>
      <textarea
        v-model="listText"
        width="500"
        height="500"
        spellcheck="false"
      />
      <button @click="set(true)">
        Set
      </button>
      <div class="add-one">
        <input v-model="oneText" type="text" @keydown.enter="addOne">
        <button :disabled="!oneText" @click="addOne">
          Add one
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'WordsList',
  data() {
    return {
      list: [],
      listText: '',
      oneText: '',
      separatorOptions: [[', ', ', '], [',', ','], ['; ', '; '], [';', ';'], ['\n', 'Enter'], [' ', 'Space']],
      separatorText: ', ',
      used: [],
      hideList: false,
    };
  },
  // computed: {
  //   separatorText() {
  //     return this.separatorOptions[this.separatorIndex];
  //   },
  // },
  watch: {
    separatorText(current, previous) {
      if (this.listText) {
        this.listText = this.filter(this.listText.split(previous)).join(current);
      }
    },
  },
  mounted() {
    this.get();
    this.getUsed();
    window.setInterval(this.getUsed, 1000 * 60);
  },
  methods: {
    filter(arr) {
      return arr.map((item) => item.trim())
        .filter((item) => item.length);
    },
    set(upload) {
      this.list = this.filter(this.listText
        .split(this.separatorText));

      if (upload) {
        this.updateList();
      }
    },
    addOne() {
      if (!this.oneText.length) {
        return;
      }
      this.list.push(this.oneText);
      this.listText += this.separatorText + this.oneText;
      this.oneText = '';
      this.updateList();
    },
    updateList() {
      axios.post('http://localhost:3000/api/list', { list: this.list, separatorText: this.separatorText })
        .then(() => {
          console.log('list updated', this.list);
        });
    },
    get() {
      axios.get('http://localhost:3000/api/list')
        .then((res) => {
          this.list = res.data.list;
          if (this.list.length) {
            if (res.data.separatorText) {
              this.separatorText = res.data.separatorText;
            }

            this.listText = this.list.join(this.separatorText);
          }
        });
    },
    resetUsed() {
      this.used = [];
      axios.post('http://localhost:3000/api/reset')
        .then(
          () => {
            console.log('Reset ok');
          },
        );
    },
    getUsed() {
      axios.get('http://localhost:3000/api/used')
        .then(
          (res) => {
            console.log('used ', res.data.length);
            this.setUsed(res.data);
          },
        );
    },
    setUsed(used) {
      this.used = used;
    },
  },
};
</script>


<style scoped lang="sass">
label
  padding: 5px
  border: 2px solid grey

textarea
  width: 500px
  height: 500px
  color: white
  background: #222
  font-size: 1.4rem


</style>
