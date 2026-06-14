import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/jewelry' },
  {
    path: '/jewelry',
    name: 'Jewelry',
    component: () => import('@/views/JewelryView.vue'),
    meta: { title: '首饰档案', icon: 'Diamond' },
  },
  {
    path: '/outfits',
    name: 'Outfits',
    component: () => import('@/views/OutfitsView.vue'),
    meta: { title: '穿搭关联', icon: 'Tshirt' },
  },
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: () => import('@/views/MaintenanceView.vue'),
    meta: { title: '养护记录', icon: 'MagicStick' },
  },
  {
    path: '/repair',
    name: 'Repair',
    component: () => import('@/views/RepairView.vue'),
    meta: { title: '维修追踪', icon: 'Tools' },
  },
  {
    path: '/lending',
    name: 'Lending',
    component: () => import('@/views/LendingView.vue'),
    meta: { title: '借还管理', icon: 'Van' },
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/views/ScheduleView.vue'),
    meta: { title: '智能排程', icon: 'Calendar' },
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/StatsView.vue'),
    meta: { title: '数据统计', icon: 'DataAnalysis' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
