<template>
  <view class="doctor-tab-bar">
    <view class="tab-item" v-for="(item, index) in tabList" :key="index" @click="switchTab(item.pagePath)">
      <view class="icon-box">
        <u-icon :name="store.currentPath === item.pagePath ? item.selectedIcon : item.icon"
          :color="store.currentPath === item.pagePath ? '#4A90E2' : '#999999'" size="22"></u-icon>
      </view>
      <text :class="['tab-text', store.currentPath === item.pagePath ? 'active' : '']">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>
import { useTabBarStore } from '@/store/tabBar'
import { onMounted } from 'vue'

const store = useTabBarStore()

onMounted(() => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const path = '/' + currentPage.route
    store.setCurrentPath(path)
  }
})

const tabList = [
  {
    pagePath: '/pages/doctor/appointments',
    text: '预约管理',
    icon: 'calendar',
    selectedIcon: 'calendar-fill'
  },
  {
    pagePath: '/pages/doctor/workbench',
    text: '看诊工作台',
    icon: 'edit-pen',
    selectedIcon: 'edit-pen-fill'
  },
  {
    pagePath: '/pages/doctor/medical-records',
    text: '病历单',
    icon: 'file-text',
    selectedIcon: 'file-text-fill'
  },
  {
    pagePath: '/pages/doctor/profile',
    text: '个人中心',
    icon: 'account',
    selectedIcon: 'account-fill'
  }
]

const switchTab = (path) => {
  if (store.currentPath === path) return
  store.setCurrentPath(path)
  uni.navigateTo({
    url: path,
    fail: () => {
      // 如果navigateTo失败，尝试switchTab
      uni.switchTab({
        url: path,
        fail: (err) => {
          console.error('导航失败:', err)
          uni.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        }
      })
    }
  })
}
</script>

<style lang="scss" scoped>
.doctor-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: #FFFFFF;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1;
  padding: 10rpx 0;
}

.icon-box {
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4rpx;
}

.tab-text {
  font-size: 24rpx;
  color: #999999;
  line-height: 1;

  &.active {
    color: #4A90E2;
  }
}
</style>