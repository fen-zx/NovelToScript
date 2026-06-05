<!-- P0 登录注册页 -->
<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/api/auth";

const router = useRouter();
const auth = useAuthStore();

const tab = ref<"login" | "register" | "reset">("login");
const submitting = ref(false);
const errorMsg = ref("");

// Login
const loginForm = reactive({ account: "", password: "" });
async function handleLogin() {
  if (!loginForm.account || !loginForm.password) {
    errorMsg.value = "请填写账号和密码";
    return;
  }
  submitting.value = true;
  errorMsg.value = "";
  try {
    const res = await authApi.login(loginForm);
    if (res.code === 0) {
      auth.setToken(res.data.token);
      auth.setUser(res.data.user);
      router.push("/");
    } else {
      errorMsg.value = res.message;
    }
  } catch {
    errorMsg.value = "网络异常，请重试";
  } finally {
    submitting.value = false;
  }
}

// Register
const registerForm = reactive({ username: "", account: "", password: "" });
const accountAvailable = ref<boolean | null>(null);
const checkingAccount = ref(false);
async function checkAccount() {
  if (!registerForm.account) return;
  checkingAccount.value = true;
  try {
    const r = await authApi.checkAccount(registerForm.account);
    accountAvailable.value = r.data.available;
  } catch {
    accountAvailable.value = null;
  } finally {
    checkingAccount.value = false;
  }
}
async function handleRegister() {
  submitting.value = true;
  try {
    const res = await authApi.register(registerForm);
    if (res.code === 0) {
      ElMessage.success("注册成功，请登录");
      tab.value = "login";
    } else {
      errorMsg.value = res.message;
    }
  } catch {
    errorMsg.value = "注册失败，请重试";
  } finally {
    submitting.value = false;
  }
}

// Reset Password
const resetStep = ref(1);
const resetForm = reactive({ username: "", newPassword: "" });
async function handleVerify() {
  try {
    await authApi.resetPassword({
      username: resetForm.username,
      newPassword: "",
    });
    resetStep.value = 2;
  } catch {
    errorMsg.value = "用户名不存在";
  }
}
async function handleReset() {
  try {
    await authApi.resetPassword(resetForm);
    ElMessage.success("密码重置成功");
    tab.value = "login";
  } catch {
    errorMsg.value = "重置失败";
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="login-card">
      <h2>🎬 NovelToScript</h2>
      <p class="sub">AI 小说转剧本工具</p>

      <div class="tabs">
        <span :class="{ active: tab === 'login' }" @click="tab = 'login'"
          >登录</span
        >
        <span :class="{ active: tab === 'register' }" @click="tab = 'register'"
          >注册</span
        >
        <span :class="{ active: tab === 'reset' }" @click="tab = 'reset'"
          >重置密码</span
        >
      </div>

      <!-- 登录 -->
      <el-form v-if="tab === 'login'" @submit.prevent="handleLogin">
        <el-alert
          v-if="errorMsg"
          :title="errorMsg"
          type="error"
          show-icon
          class="mb8"
        />
        <el-form-item
          ><el-input
            v-model="loginForm.account"
            placeholder="请输入账号"
            size="large"
        /></el-form-item>
        <el-form-item
          ><el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            @keyup.enter="handleLogin"
        /></el-form-item>
        <el-button
          type="primary"
          size="large"
          class="w-full"
          :loading="submitting"
          @click="handleLogin"
          >登 录</el-button
        >
        <p class="link" @click="tab = 'register'">没有账号？立即注册 →</p>
        <p class="link" @click="tab = 'reset'">忘记密码？</p>
      </el-form>

      <!-- 注册 -->
      <el-form v-if="tab === 'register'" @submit.prevent="handleRegister">
        <el-form-item
          ><el-input
            v-model="registerForm.username"
            placeholder="用户名 (2-20字)"
            size="large"
        /></el-form-item>
        <el-form-item>
          <el-input
            v-model="registerForm.account"
            placeholder="账号 (字母数字下划线)"
            size="large"
            @blur="checkAccount"
          />
          <span v-if="checkingAccount" class="checking">检查中...</span>
          <span v-else-if="accountAvailable === true" class="check-ok"
            >✓ 可用</span
          >
          <span v-else-if="accountAvailable === false" class="check-fail"
            >✗ 已存在</span
          >
        </el-form-item>
        <el-form-item
          ><el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码 (≥6位)"
            size="large"
            show-password
        /></el-form-item>
        <el-button
          type="primary"
          size="large"
          class="w-full"
          :loading="submitting"
          @click="handleRegister"
          >注 册</el-button
        >
        <p class="link" @click="tab = 'login'">已有账号？去登录 →</p>
      </el-form>

      <!-- 重置密码 -->
      <div v-if="tab === 'reset'">
        <template v-if="resetStep === 1">
          <el-form-item
            ><el-input
              v-model="resetForm.username"
              placeholder="请输入用户名"
              size="large"
          /></el-form-item>
          <el-button
            type="primary"
            size="large"
            class="w-full"
            @click="handleVerify"
            >验 证</el-button
          >
        </template>
        <template v-else>
          <el-form-item
            ><el-input
              v-model="resetForm.newPassword"
              type="password"
              placeholder="新密码 (≥6位)"
              size="large"
              show-password
          /></el-form-item>
          <el-button
            type="primary"
            size="large"
            class="w-full"
            @click="handleReset"
            >提 交</el-button
          >
        </template>
        <p class="link" @click="tab = 'login'">返回登录</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #e8d5f5 0%,
    #d5e8f5 30%,
    #e8f5d5 60%,
    #f5e8d5 100%
  );
}
.login-card {
  width: 400px;
  padding: 36px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
}
h2 {
  text-align: center;
  margin-bottom: 4px;
  font-size: 22px;
}
.sub {
  text-align: center;
  color: #788;
  margin-bottom: 24px;
  font-size: 13px;
}
.tabs {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}
.tabs span {
  flex: 1;
  text-align: center;
  padding: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #909399;
  border-bottom: 2px solid transparent;
}
.tabs span.active {
  color: #6c5ce7;
  border-bottom-color: #6c5ce7;
}
.w-full {
  width: 100%;
}
.mb8 {
  margin-bottom: 8px;
}
.link {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
}
.link:hover {
  color: #6c5ce7;
}
.checking {
  font-size: 12px;
  color: #909399;
}
.check-ok {
  font-size: 12px;
  color: #67c23a;
}
.check-fail {
  font-size: 12px;
  color: #e17055;
}
</style>
