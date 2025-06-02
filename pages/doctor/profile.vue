<template>
	<view class="profile-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<text class="title">我的</text>
			<view class="right">
				<u-icon name="more-dot-fill" color="#333333" size="20"></u-icon>
			</view>
		</view>

		<!-- 个人信息卡片 -->
		<view class="user-info" @click="chooseAvatar">
			<image class="avatar" :src="doctorInfo.avatar || defaultAvatar" mode="aspectFill"></image>
			<view class="info">
				<view class="name-row">
					<text class="name">{{ doctorInfo.name || '未设置' }}</text>
					<text class="title">{{ doctorInfo.title || '主治医师' }}</text>
				</view>
				<text class="hospital">{{ doctorInfo.hospital || '未设置' }}</text>
			</view>
		</view>

		<!-- 数据统计 -->
		<view class="stat-box">
			<view class="stat-item" @click="navigateTo('patients')">
				<u-icon name="account" color="#4A90E2" size="44"></u-icon>
				<text class="label">我的患者</text>
			</view>
			<view class="stat-item" @click="navigateTo('completed')">
				<u-icon name="checkmark-circle" color="#4A90E2" size="44"></u-icon>
				<text class="label">已完成</text>
			</view>
		</view>

		<!-- 功能列表 -->
		<view class="function-list">
			<view class="section-title">服务功能</view>
			<view class="list-content">
				<view class="function-item" @click="navigateTo('info')">
					<view class="item-left">
						<u-icon name="file-text" color="#FFAA33" size="22" class="item-icon"></u-icon>
						<text class="item-text">完善信息</text>
					</view>
					<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
				</view>
				<view class="function-item" @click="navigateTo('feedback')">
					<view class="item-left">
						<u-icon name="question-circle" color="#4CD964" size="22" class="item-icon"></u-icon>
						<text class="item-text">帮助反馈</text>
					</view>
					<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
				</view>
				<view class="function-item" @click="navigateTo('service')">
					<view class="item-left">
						<u-icon name="phone" color="#FF3B30" size="22" class="item-icon"></u-icon>
						<text class="item-text">客服电话</text>
					</view>
					<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
				</view>
				<view class="function-item" @click="navigateTo('about')">
					<view class="item-left">
						<u-icon name="info-circle" color="#4A90E2" size="22" class="item-icon"></u-icon>
						<text class="item-text">关于我们</text>
					</view>
					<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
				</view>
			</view>
		</view>

		<!-- 底部导航栏 -->
		<doctor-tab-bar></doctor-tab-bar>
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DoctorTabBar from '@/components/doctor-tab-bar.vue'
import { useTabBarStore } from '@/store/tabBar'
import { getDoctorInfo, uploadDoctorImage } from '@/api/doctor'

const store = useTabBarStore()
const doctorInfo = ref({})
const defaultAvatar = '/static/images/default-avatar.png'

// 选择头像
const chooseAvatar = async () => {
	try {
		// 显示操作菜单
		const { tapIndex } = await uni.showActionSheet({
			itemList: ['使用微信头像', '从相册选择', '拍照']
		})

		if (tapIndex === 0) {
			// 获取微信头像
			const { userInfo } = await uni.getUserProfile({
				desc: '用于完善医生资料'
			})
			if (userInfo.avatarUrl) {
				await updateAvatar(userInfo.avatarUrl)
			}
		} else {
			// 从相册或相机选择
			const { tempFilePaths } = await uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: tapIndex === 1 ? ['album'] : ['camera']
			})

			if (tempFilePaths && tempFilePaths[0]) {
				await updateAvatar(tempFilePaths[0])
			}
		}
	} catch (error) {
		console.error('选择头像失败:', error)
		if (error.errMsg !== 'getUserProfile:fail auth deny') {
			uni.showToast({
				title: '选择头像失败',
				icon: 'none'
			})
		}
	}
}

// 更新头像
const updateAvatar = async (avatarPath) => {
	try {
		uni.showLoading({
			title: '保存中...',
			mask: true
		})

		// 更新本地数据
		doctorInfo.value.avatar = avatarPath

		// 更新本地存储
		const currentUserInfo = uni.getStorageSync('userInfo') || {}
		const updatedUserInfo = {
			...currentUserInfo,
			avatar: avatarPath
		}
		uni.setStorageSync('userInfo', updatedUserInfo)

		// 触发更新事件
		uni.$emit('doctorInfoUpdated', updatedUserInfo)

		uni.hideLoading()
		uni.showToast({
			title: '更新成功',
			icon: 'success'
		})
	} catch (error) {
		console.error('保存头像失败:', error)
		uni.hideLoading()
		uni.showToast({
			title: '保存失败',
			icon: 'none'
		})
	}
}

// 页面跳转
const navigateTo = (type) => {
	const routes = {
		info: '/pages/doctor/personal-info',
		patients: '/pages/doctor/patient-list',
		pending: '/pages/doctor/appointments',
		completed: '/pages/doctor/appointments',
		workbench: '/pages/doctor/workbench'
	}

	// 特殊处理的功能项
	const specialHandlers = {
		feedback: () => {
			uni.showModal({
				title: '帮助反馈',
				content: '如果您在使用过程中遇到任何问题，请联系客服反馈。',
				showCancel: false
			})
		},
		service: () => {
			uni.showModal({
				title: '客服电话',
				content: '400-123-4567',
				confirmText: '拨打',
				success: (res) => {
					if (res.confirm) {
						uni.makePhoneCall({
							phoneNumber: '4001234567',
							fail: () => {
								uni.showToast({
									title: '拨打失败',
									icon: 'none'
								})
							}
						})
					}
				}
			})
		},
		about: () => {
			uni.showModal({
				title: '关于我们',
				content: 'AI皮肤病诊断系统 v1.0.0\n为患者提供便捷的在线问诊服务',
				showCancel: false
			})
		}
	}

	if (specialHandlers[type]) {
		specialHandlers[type]()
	} else if (routes[type]) {
		if (type === 'pending' || type === 'completed') {
			uni.reLaunch({
				url: `${routes[type]}?status=${type}`,
				success: () => {
					store.setCurrentPath('/pages/doctor/appointments')
				},
				fail: (error) => {
					console.error('跳转失败:', error)
					uni.showToast({
						title: '跳转失败',
						icon: 'none'
					})
				}
			})
		} else {
			uni.navigateTo({
				url: routes[type],
				fail: (error) => {
					console.error('跳转失败:', error)
					uni.showToast({
						title: '跳转失败',
						icon: 'none'
					})
				}
			})
		}
	}
}

// 获取医生信息
const fetchDoctorInfo = async () => {
	try {
		// 从本地存储获取数据
		const userInfo = uni.getStorageSync('userInfo')
		if (userInfo) {
			doctorInfo.value = userInfo
			return
		}

		// 如果本地没有数据，则使用默认值
		doctorInfo.value = {
			avatar: '',
			name: '未设置',
			title: '主治医师',
			hospital: '未设置'
		}
	} catch (error) {
		console.error('获取医生信息失败:', error)
		uni.showToast({
			title: '获取信息失败',
			icon: 'none'
		})
	}
}

onMounted(() => {
	// 检查用户角色
	const role = store.getCurrentRole()
	if (role !== 'doctor') {
		uni.reLaunch({
			url: '/pages/choose-role/index'
		})
		return
	}

	store.setCurrentPath('/pages/doctor/profile')
	fetchDoctorInfo()

	// 监听个人信息更新
	uni.$on('doctorInfoUpdated', (info) => {
		doctorInfo.value = info
	})
})

onUnmounted(() => {
	// 移除事件监听
	uni.$off('doctorInfoUpdated')
})
</script>

<style lang="scss" scoped>
.profile-container {
	min-height: 100vh;
	background: #F5F6FA;
	padding-bottom: 120rpx;
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #FFFFFF;

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
	}

	.right {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.user-info {
	padding: 32rpx;
	background: #FFFFFF;
	display: flex;
	align-items: center;

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		margin-right: 24rpx;
	}

	.info {
		flex: 1;

		.name-row {
			display: flex;
			align-items: center;
			margin-bottom: 8rpx;

			.name {
				font-size: 36rpx;
				font-weight: 500;
				color: #333333;
				margin-right: 16rpx;
			}

			.title {
				font-size: 24rpx;
				color: #4CD964;
				background: rgba(76, 217, 100, 0.1);
				padding: 4rpx 12rpx;
				border-radius: 4rpx;
			}
		}

		.hospital {
			font-size: 28rpx;
			color: #666666;
		}
	}
}

.stat-box {
	margin: 20rpx 32rpx;
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	display: flex;
	justify-content: space-around;

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;

		.label {
			font-size: 28rpx;
			color: #333333;
		}
	}
}

.function-list {
	margin: 0 32rpx;
	background: #FFFFFF;
	border-radius: 16rpx;

	.section-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333333;
		padding: 32rpx;
		border-bottom: 1px solid #EEEEEE;
	}

	.list-content {
		padding: 0 32rpx;
	}

	.function-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx 0;
		border-bottom: 1px solid #EEEEEE;

		&:last-child {
			border-bottom: none;
		}

		.item-left {
			display: flex;
			align-items: center;
			gap: 16rpx;

			.item-text {
				font-size: 32rpx;
				color: #333333;
			}
		}
	}
}
</style>