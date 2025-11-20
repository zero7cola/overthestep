<template>
  <div class="accounting">
    <h2>打牌记账计算器</h2>

    <table>
      <thead>
      <tr>
        <th>姓名</th>
        <th>输赢 (正=赢,负=输)</th>
        <th>支出</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(p, index) in players" :key="index">
        <td><input v-model="p.name" /></td>
        <td><input type="number" step="0.01" v-model.number="p.result" /></td>
        <td><input type="number" step="0.01" v-model.number="p.cost" /></td>
        <td><button @click="removePlayer(index)">删除</button></td>
      </tr>
      </tbody>
    </table>

    <div style="margin-bottom:8px;">
      <button @click="addPlayer">添加玩家</button>
      <button @click="resetPlayers" style="margin-left:8px;">重置默认玩家</button>
    </div>

    <div class="mode">
      <label>记账模式：</label>
      <select v-model="mode">
        <option value="1">1. 只有赢家按盈利比例分摊（输和平返还支出）</option>
        <option value="2">2. 所有人平摊支出</option>
        <option value="3">3. 复杂模式：盈利部分赢家承担，剩余输家平摊</option>
      </select>
    </div>

    <div style="margin-top:10px;">
      <button class="calc" @click="calc">计算</button>
    </div>

    <!-- 校验提示 -->
    <div v-if="error" class="error" role="alert" style="margin-top:10px;">
      ⚠️ {{ error }}
    </div>

    <div v-if="results.length && !error" class="result" style="margin-top:12px;">
      <h3>计算结果</h3>
      <ul>
        <li v-for="(r, index) in results" :key="index">
          {{ r.name }}：
          <strong :class="{ positive: r.final > 0, negative: r.final < 0 }">
            {{ r.final > 0 ? '+' + r.final.toFixed(2) : r.final.toFixed(2) }}
          </strong>
          <span v-if="r.note" style="margin-left:8px;color:#666">（{{ r.note }}）</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";

// 默认 6 名玩家（可重置）
const defaultPlayers = [
  { name: "aahzp", result: 0, cost: 0 },
  { name: "bbjj",  result: 0, cost: 0 },
  { name: "ccxb",  result: 0, cost: 0 },
  { name: "ddzz",  result: 0, cost: 0 },
  { name: "eedl",  result: 0, cost: 0 },
  { name: "fflm",  result: 0, cost: 0 },
];

const players = reactive(defaultPlayers.map(p => ({ ...p })));
const mode = ref("1");
const results = ref([]);
const error = ref("");

const addPlayer = () => players.push({ name: "", result: 0, cost: 0 });
const removePlayer = (i) => players.splice(i, 1);
const resetPlayers = () => {
  players.splice(0, players.length, ...defaultPlayers.map(p => ({ ...p })));
  results.value = [];
  error.value = "";
};

const nearlyZero = (v) => Math.abs(v) < 0.0001;

const calc = () => {
  error.value = "";
  results.value = [];

  // 校验：输赢之和必须为 0（考虑小数误差）
  const sumResult = players.reduce((s, p) => s + Number(p.result || 0), 0);
  if (!nearlyZero(sumResult)) {
    error.value = `打牌输赢总和不为 0（当前和：${sumResult.toFixed(2)}），请检查每个人的输赢输入。`;
    return;
  }

  const totalCost = players.reduce((sum, p) => sum + Number(p.cost || 0), 0);
  const winners = players.filter(p => Number(p.result) > 0);
  const losers  = players.filter(p => Number(p.result) < 0);
  const draws   = players.filter(p => Number(p.result) === 0);
  const totalWin = winners.reduce((s, p) => s + Number(p.result), 0);

  // finalMap 存放中间结果（未格式化）
  const finalMap = {};
  players.forEach(p => finalMap[p.name] = 0);

  // -------------------- 规则 1 --------------------
  if (mode.value === "1") {
    // 平局：返还自己的支出（最终 = cost）
    draws.forEach(p => {
      finalMap[p.name] = Number(p.cost || 0);
    });

    // 输家：他们的最终 = result + cost （result < 0）
    losers.forEach(p => {
      finalMap[p.name] = Number(p.result || 0) + Number(p.cost || 0);
    });

    // 赢家：按盈利比例承担 totalCost（若没有赢家 totalWin==0，则无分摊）
    winners.forEach(p => {
      const share = totalWin > 0 ? totalCost * (Number(p.result) / totalWin) : 0;
      finalMap[p.name] = Number(p.result) - share;
    });
  }

  // -------------------- 规则 2：所有人平摊 --------------------
  else if (mode.value === "2") {
    const avg = players.length > 0 ? totalCost / players.length : 0;
    players.forEach(p => {
      // 采用“最终 = result - avg + cost”的语义（即考虑已付支出）
      finalMap[p.name] = Number(p.result || 0) - avg + Number(p.cost || 0);
    });
  }

  // -------------------- 规则 3：复杂模式 --------------------
  else if (mode.value === "3") {
    // 胜利者承担最多为 totalWin 部分的支出（如果 totalCost <= totalWin 则全部由赢家承担）
    if (totalCost <= totalWin) {
      winners.forEach(p => {
        const share = totalCost * (Number(p.result) / totalWin);
        finalMap[p.name] = Number(p.result) - share;
      });
    } else {
      // 支出 > 总盈利
      const winPart = totalWin; // 赢家承担的上限 = totalWin
      const remain = totalCost - winPart; // 剩余由输家平摊
      const loseAvg = losers.length > 0 ? remain / losers.length : 0;

      // 赢家按比例承担 winPart 部分
      winners.forEach(p => {
        const share = winPart * (Number(p.result) / totalWin);
        finalMap[p.name] = Number(p.result) - share;
      });

      // 输家平摊剩余（并保留他们自身的输赢）
      losers.forEach(p => {
        finalMap[p.name] = Number(p.result) - loseAvg;
      });
    }

    // 平局返还 cost
    draws.forEach(p => {
      finalMap[p.name] = Number(p.cost || 0);
    });
  }

  // 结果数组化（保留两位小数）
  results.value = players.map(p => ({
    name: p.name,
    final: Number((finalMap[p.name] || 0).toFixed(2)),
    note: "",
  }));
};
</script>

<style scoped>
.accounting {
  max-width: 900px;
  margin: auto;
  padding: 12px;
  font-size: 15px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}

th, td {
  border: 1px solid #ddd;
  padding: 6px;
  text-align: center;
}

input {
  width: 100%;
  padding: 4px;
  box-sizing: border-box;
}

button {
  padding: 6px 10px;
  margin: 4px;
}

.mode {
  margin: 8px 0;
}

.calc {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
}

.result {
  margin-top: 12px;
}

.positive {
  color: green;
}

.negative {
  color: red;
}

.error {
  color: #b91c1c;
  background: #fff1f2;
  border: 1px solid #fecaca;
  padding: 8px;
  border-radius: 4px;
}
</style>
