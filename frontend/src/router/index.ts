// Vue Router 配置
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('@/views/Auth/AuthPage.vue'),
      meta: { title: '登录', guest: true },
    },
    {
      path: '/',
      component: () => import('@/components/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/views/Home/HomePage.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'import',
          name: 'Import',
          component: () => import('@/views/Import/ImportPage.vue'),
          meta: { title: '导入小说' },
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: () => import('@/views/Tasks/TaskListPage.vue'),
          meta: { title: '分析任务' },
        },
        {
          path: 'tasks/:id',
          name: 'TaskDetail',
          component: () => import('@/views/TaskDetail/TaskDetailPage.vue'),
          meta: { title: '任务详情' },
          props: true,
        },
        {
          path: 'script/:id',
          name: 'ScriptEditor',
          component: () => import('@/views/ScriptEditor/ScriptEditorPage.vue'),
          meta: { title: '剧本编辑' },
          props: true,
        },
        {
          path: 'schema',
          name: 'Schema',
          component: () => import('@/views/Schema/SchemaPage.vue'),
          meta: { title: 'YAML Schema' },
        },
      ],
    },
  ],
})

// AuthGuard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) return next('/auth')
  if (to.meta.guest && token) return next('/')
  next()
})

export default router
