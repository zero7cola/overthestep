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

// 默认玩家
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

  // 校验输赢和
  const sumResult = players.reduce((s, p) => s + Number(p.result || 0), 0);
  if (!nearlyZero(sumResult)) {
    error.value = `打牌输赢总和不为 0（当前和：${sumResult.toFixed(2)}），请检查所有人的输赢输入。`;
    return;
  }

  const totalCost = players.reduce((sum, p) => sum + Number(p.cost || 0), 0);
  const winners = players.filter(p => Number(p.result) > 0);
  const losers  = players.filter(p => Number(p.result) < 0);
  const draws   = players.filter(p => Number(p.result) === 0);
  const totalWin = winners.reduce((s, p) => s + Number(p.result), 0);

  const finalMap = {};
  players.forEach(p => finalMap[p.name] = 0);

  // -------------------- 规则 1（最新修正版） --------------------
  if (mode.value === "1") {
    // 返还所有人的支出
    players.forEach(p => {
      finalMap[p.name] = Number(p.cost || 0);
    });

    // 输家：最终 = 输的钱 + cost
    losers.forEach(p => {
      finalMap[p.name] = Number(p.result || 0) + Number(p.cost || 0);
    });

    // 平局：最终 = cost （上面已经设置）
    // 赢家：最终 = result - 分摊 + cost
    winners.forEach(p => {
      const share = totalWin > 0 ? totalCost * (Number(p.result) / totalWin) : 0;
      finalMap[p.name] = Number(p.result) - share + Number(p.cost || 0);
    });
  }

  // -------------------- 规则 2：所有人平摊 --------------------
  else if (mode.value === "2") {
    const avg = players.length ? totalCost / players.length : 0;
    players.forEach(p => {
      finalMap[p.name] = Number(p.result || 0) - avg + Number(p.cost || 0);
    });
  }

  // -------------------- 规则 3：复杂模式 --------------------
  else if (mode.value === "3") {
    if (totalCost <= totalWin) {
      winners.forEach(p => {
        const share = totalCost * (Number(p.result) / totalWin);
        finalMap[p.name] = Number(p.result) - share;
      });
    } else {
      const winPart = totalWin;
      const remain = totalCost - winPart;
      const loseAvg = losers.length > 0 ? remain / losers.length : 0;

      winners.forEach(p => {
        const share = winPart * (Number(p.result) / totalWin);
        finalMap[p.name] = Number(p.result) - share;
      });

      losers.forEach(p => {
        finalMap[p.name] = Number(p.result) - loseAvg;
      });
    }

    draws.forEach(p => {
      finalMap[p.name] = Number(p.cost || 0);
    });
  }

  // 格式化结果
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
