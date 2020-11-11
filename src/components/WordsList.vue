<template>
  <div class="container">
    <div v-if="list.length" class="used">
      <h2>Used: {{ usedCount + tempUsed }} / {{ list.length }}</h2>

      <button @click="resetUsed">
        <span>
          Reset Used
        </span>
      </button>
    </div>
    <button class="hide" @click="() => hideList = !hideList">
      <span>
        {{ hideList ? 'Show List' : 'Hide List' }}
      </span>
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

      <button @click="overwrite">
        <span>
          Overwrite
        </span>
      </button>
      <button @click="append">
        <span>
          Append
        </span>
      </button>
      <div class="add-one">
        <div class="text-input" @click="$refs.addOne.focus()">
          <input
            ref="addOne"
            v-model="oneText"
            type="text"
            class="add-one-input"
            placeholder="Add One"
            @keydown.enter="addOne"
          >
          <label />
        </div>

        <button :disabled="!oneText" @click="addOne">
          <span>
            Add One
          </span>
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
      separatorOptions: [[',', ','], [';', ';'], ['\n', 'Enter'], [' ', 'Space']],
      separatorText: ',',
      used: [],
      hideList: false,
      tempUsed: 0,
    };
  },
  computed: {
    usedCount() {
      return this.list.reduce((acc, item) => (item.used ? acc + 1 : acc), 0);
    },
  },
  watch: {
    separatorText(current, previous) {
      if (this.listText) {
        this.listText = this.listToArray(previous).join(current);
      }
    },
  },
  mounted() {
    this.get();
    window.setInterval(this.getUsed, 1000 * 30);
  },
  methods: {
    listToArray(separator = this.separatorText) {
      return this.listText
        .split(separator)
        .map((text) => text.trim())
        .filter((text) => text.length);
    },
    convert(list, direction) {
      if (direction) {
        return list.map((text) => ({ text }));
      }
      return list.map((item) => item.text);
    },
    overwrite() {
      this.list = this.convert(this.listToArray(), true);
      this.updateList(this.listToArray(), true);
    },
    append() {
      const list = this.listToArray();
      this.updateList(list);
      this.listToText();
    },
    addOne() {
      const trimmed = this.oneText.trim();
      if (!trimmed.length) {
        return;
      }
      this.listText += (this.listText.length ? this.separatorText : '') + trimmed;
      this.updateList([trimmed]);

      this.oneText = '';
    },
    updateList(list, overWrite = false) {
      if (!overWrite) {
        this.list.push(...this.convert(list, true));
      }

      axios.post(`${process.env.VUE_APP_URL}/api/list`, { overWrite, list, separatorText: this.separatorText })
        .then(() => {
          console.log('update ok');
        });
    },
    get() {
      axios.get(`${process.env.VUE_APP_URL}/api/list`)
        .then((res) => {
          if (res.data.separatorText) {
            this.separatorText = res.data.separatorText;
          }
          this.list = res.data.list;
          this.listToText();
        });
    },
    listToText() {
      this.listText = this.convert(this.list, false).join(this.separatorText);
    },
    resetUsed() {
      this.list = this.list.map((item) => ({ text: item.text }));
      this.tempUsed = 0;
      axios.post(`${process.env.VUE_APP_URL}/api/reset`)
        .then(() => {
          console.log('Reset ok');
        });
    },
    getUsed() {
      axios.get(`${process.env.VUE_APP_URL}/api/used`)
        .then(
          (res) => {
            if (res.data) {
              res.data.forEach((state, index) => {
                if (state) {
                  this.list[index].used = 1;
                }
              });
              this.tempUsed = 0;
            }
          },
        );
    },
    incTempUsed() {
      this.tempUsed += 1;
    },
  },
};
</script>


<style scoped lang="sass">
button
  @include btn
  display: inline-flex
  margin: 1em 0
  margin-right: 1em

.separator
  label
    padding: 1em

textarea
  margin-top: 2em
  width: 500px
  height: 500px
  color: white
  background: none
  font: inherit
  letter-spacing: 0.02em
  font-size: 1.2rem


.add-one
  height: min-content
  display: flex
  justify-content: space-between
  align-items: flex-end

  button
    margin: 0

  .text-input
    margin-right: 2em
    flex-grow: 1
    @include text-input


</style>
