<template>
  <div class="container">
    <button @click="get">
      Get List
    </button>
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
    <textarea v-model="listText" width="500" height="500" />
    <button @click="set">
      Set
    </button>
    <div class="add-one">
      <input v-model="oneText" type="text">
      <button @click="addOne">
        Add one
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'WordsList',
  data() {
    return {
      listArray: [['a1', 'b2', 'c3', 'd5']],
      listText: '',
      oneText: '',
      separatorOptions: [[', ', ', '], [',', ','], ['; ', '; '], [';', ';'], ['\n', 'Enter'], [' ', 'Space']],
      separatorText: ', ',
    };
  },
  // computed: {
  //   separatorText() {
  //     return this.separatorOptions[this.separatorIndex];
  //   },
  // },
  watch: {
    separatorText(current, previous) {
      console.log(this.separatorText);
      this.listText = this.listText
        .split(previous)
        .join(current);
    },
  },
  mounted() {
    this.get();
  },
  methods: {
    set() {
      this.list = this.listText.split(this.separatorText);
      this.updateList();
    },
    addOne() {
      this.list.push(this.oneText);
      this.listText += this.separatorText + this.oneText;
      this.updateList();
    },
    updateList() {
      console.log(this.separatorText, this.list);

      axios.post('http://localhost:3000/api/list', { list: this.listArray, separator: this.separatorText })
        .then(() => {
          console.log('list updated', this.list);
        });
    },
    get() {
      axios.get('http://localhost:3000/api/list')
        .then((res) => {
          this.list = res.data.list;
          this.separatorText = res.data.separatorText;
          this.listText = this.list.join(this.separator);
        });
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


</style>
