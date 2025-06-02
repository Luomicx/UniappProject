<template>
	<view class="tab-bar">
		<view v-for="(item, index) in currentTabList" :key="index" :class="['tab-item', { 'special': item.isSpecial }]"
			@click="switchTab(item.pagePath)">
			<view :class="['icon-box', { 'special-icon': item.isSpecial }]">
				<u-icon :name="getCurrentPath === item.pagePath ? item.selectedIcon || item.icon : item.icon"
					:color="getCurrentPath === item.pagePath ? (item.isSpecial ? '#FFFFFF' : '#4A90E2') : (item.isSpecial ? '#FFFFFF' : '#999999')"
					:size="item.isSpecial ? 28 : 22">
				</u-icon>
			</view>
			<text :class="['text', {
				'active': getCurrentPath === item.pagePath,
				'special-text': item.isSpecial
			}]">{{ item.text }}</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTabBarStore } from '@/store/tabBar'

const store = useTabBarStore()

// 使用计算属性获取当前路径
const getCurrentPath = computed(() => store.currentPath)

// 定义不同角色的tabBar配置
const tabBarConfig = {
	patient: [{
		pagePath: '/pages/patient/index',
		text: '首页',
		icon: 'home',
		selectedIcon: 'home-fill'
	},
	{
		pagePath: '/pages/patient/consultation',
		text: '咨询预约',
		icon: 'calendar',
		selectedIcon: 'calendar-fill'
	},
	{
		pagePath: '/pages/patient/ai-assistant',
		text: 'AI助手',
		icon: 'chat',
		selectedIcon: 'chat-fill',
		isSpecial: true
	},
	{
		pagePath: '/pages/patient/community',
		text: '社圈',
		icon: 'grid',
		selectedIcon: 'grid-fill'
	},
	{
		pagePath: '/pages/patient/profile',
		text: '我的',
		icon: 'account',
		selectedIcon: 'account-fill'
	}
	],
	doctor: [{
		pagePath: '/pages/doctor/appointments',
		text: '预约管理',
		icon: 'calendar',
		selectedIcon: 'calendar-fill'
	},
	{
		pagePath: '/pages/doctor/profile',
		text: '我的',
		icon: 'account',
		selectedIcon: 'account-fill'
	}
	]
}

// 根据当前角色获取对应的tabBar列表
const currentTabList = computed(() => {
	const role = store.getCurrentRole()
	return tabBarConfig[role] || tabBarConfig.patient
})

// 切换标签页
const switchTab = (path) => {
	if (getCurrentPath.value === path) return

	uni.switchTab({
		url: path,
		success: () => {
			store.setCurrentPath(path)
		},
		fail: (error) => {
			console.error('切换失败，尝试使用navigateTo:', error)
			uni.navigateTo({
				url: path,
				success: () => {
					store.setCurrentPath(path)
				},
				fail: (error) => {
					console.error('导航失败:', error)
					uni.showToast({
						title: '页面跳转失败',
						icon: 'none'
					})
				}
			})
		}
	})
}

// 监听路由变化
watch(() => getCurrentPath.value, (newPath) => {
	if (newPath) {
		const matchingTab = currentTabList.value.find(tab => tab.pagePath === newPath)
		if (matchingTab) {
			store.setCurrentPath(newPath)
		}
	}
}, { immediate: true })

onMounted(() => {
	// 获取当前页面路径
	const pages = getCurrentPages()
	if (pages.length > 0) {
		const currentPage = pages[pages.length - 1]
		const path = '/' + currentPage.route
		store.setCurrentPath(path)
	}
})
</script>

<style lang="scss" scoped>
.tab-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 120rpx;
	background: #FFFFFF;
	box-shadow: 0 -2rpx 4rpx rgba(0, 0, 0, 0.05);
	display: flex;
	padding-bottom: env(safe-area-inset-bottom);

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;

		&.special {
			margin-top: -40rpx;

			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				width: 120rpx;
				height: 120rpx;
				background: #007AFF;
				border-radius: 60rpx;
				transform: translate(-50%, -50%);
				box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.3);
				z-index: 0;
				transition: all 0.3s ease;
			}

			&:active::after {
				transform: translate(-50%, -50%) scale(0.95);
				box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.2);
			}
		}

		.icon-box {
			height: 44rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 4rpx;
			position: relative;
			z-index: 1;

			&.special-icon {
				margin-bottom: 2rpx;
				transform: translateY(4rpx);
			}
		}

		.text {
			font-size: 24rpx;
			color: #999999;
			line-height: 1;
			position: relative;
			z-index: 1;

			&.active {
				color: #4A90E2;
			}

			&.special-text {
				color: #FFFFFF;
				font-weight: 500;

				&.active {
					color: #FFFFFF;
				}
			}
		}
	}
}
</style>
