<template>
	<view class="profile-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<text class="title">我的</text>
			<view class="header-right">
				<u-icon name="more-dot-fill" size="20" @click="showSettings"></u-icon>
				<u-icon name="camera-fill" size="20" style="margin-left: 16rpx;"></u-icon>
			</view>
		</view>

		<!-- 用户信息区域 -->
		<view class="user-info">
			<button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
				<image class="avatar" :src="userInfo.avatarUrl || defaultAvatar" mode="aspectFill"></image>
			</button>
			<view class="info">
				<text class="name">{{ userInfo.name || '点击设置昵称' }}</text>
				<text class="phone">{{ formatPhone(userInfo.phone_number) || '绑定手机号享受完整服务' }}</text>
			</view>
		</view>

		<!-- 核心功能区 -->
		<view class="main-function">
			<view class="function-card">
				<view class="card-title">健康服务</view>
				<view class="function-list">
					<view class="function-item" @click="navigateTo('medical-records')">
						<view class="item-left">
							<u-icon name="file-text" color="#4A90E2" size="32" class="item-icon"></u-icon>
							<view class="text-group">
								<text class="item-title">我的病历</text>
								<text class="item-subtitle">随时查看就诊记录</text>
							</view>
						</view>
						<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
					</view>
					<view class="function-item" @click="navigateTo('my-appointments')">
						<view class="item-left">
							<u-icon name="calendar" color="#4CD964" size="32" class="item-icon"></u-icon>
							<view class="text-group">
								<text class="item-title">我的预约</text>
								<text class="item-subtitle">管理您的就诊安排</text>
							</view>
						</view>
						<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
					</view>
					<view class="function-item" @click="navigateTo('detection-history')">
						<view class="item-left">
							<u-icon name="checkmark-circle" color="#FF9500" size="32" class="item-icon"></u-icon>
							<view class="text-group">
								<text class="item-title">检测历史</text>
								<text class="item-subtitle">查看历史检测记录</text>
							</view>
						</view>
						<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
					</view>
				</view>
			</view>

			<view class="function-card">
				<view class="card-title">账户服务</view>
				<view class="function-list">
					<view class="function-item" @click="navigateTo('personal-info')">
						<view class="item-left">
							<u-icon name="account" color="#FF9500" size="32" class="item-icon"></u-icon>
							<view class="text-group">
								<text class="item-title">个人信息</text>
								<text class="item-subtitle">完善资料获得更好服务</text>
							</view>
						</view>
						<u-icon name="arrow-right" color="#999999" size="18"></u-icon>
					</view>
				</view>
			</view>
		</view>

		<!-- 服务功能区 -->
		<view class="service-section">
			<view class="function-card">
				<view class="card-title">客户服务</view>
				<view class="service-list">
					<view class="service-item" @click="showFeedback">
						<view class="service-item-left">
							<u-icon name="question-circle" size="32" color="#4CD964"></u-icon>
							<view class="text-group">
								<text class="item-title">帮助中心</text>
								<text class="item-subtitle">使用指南与常见问题</text>
							</view>
						</view>
						<u-icon name="arrow-right" size="24" color="#999999"></u-icon>
					</view>
					<view class="service-item" @click="showCustomerService">
						<view class="service-item-left">
							<u-icon name="phone" size="32" color="#FF9500"></u-icon>
							<view class="text-group">
								<text class="item-title">客服热线</text>
								<text class="item-subtitle">08:00-22:00 全年无休</text>
							</view>
						</view>
						<u-icon name="arrow-right" size="24" color="#999999"></u-icon>
					</view>
					<view class="service-item" @click="showAboutUs">
						<view class="service-item-left">
							<u-icon name="info-circle" size="32" color="#007AFF"></u-icon>
							<view class="text-group">
								<text class="item-title">关于我们</text>
								<text class="item-subtitle">版本号 2.1.0 | 服务协议</text>
							</view>
						</view>
						<u-icon name="arrow-right" size="24" color="#999999"></u-icon>
					</view>
				</view>
			</view>
		</view>

		<!-- 客服电话弹窗 -->
		<u-popup :show="showServicePopup" mode="center" @close="closePopup">
			<view class="popup-content">
				<view class="popup-title">客服热线</view>
				<view class="popup-text">188-8888-8888</view>
				<view class="popup-hint">服务时间：每日 08:00 - 22:00</view>
				<view class="popup-buttons">
					<button class="popup-btn cancel" @click="closePopup">取消</button>
					<button class="popup-btn confirm" @click="makePhoneCall">立即拨打</button>
				</view>
			</view>
		</u-popup>

		<!-- 添加自定义 tabBar -->
		<custom-tab-bar></custom-tab-bar>
	</view>
</template>

<script setup>
import CustomTabBar from '@/components/custom-tab-bar.vue'
import { useTabBarStore } from '@/store/tabBar'
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'
import { getPatientInfo } from '@/api/patient'

const store = useTabBarStore()
const userInfoStore = useUserInfoStore()
const userInfo = ref({})
const defaultAvatar = '/static/user-avatar.svg'
const showServicePopup = ref(false)

onMounted(async () => {
	store.setCurrentPath('/pages/patient/profile')

	// TODO: 等待后端 API 实现后，这里会从后端获取最新数据
	await userInfoStore.fetchUserInfo()

	// 初始化用户信息
	updatePageUserInfo()

	// 监听用户信息更新事件
	uni.$on('userInfoUpdated', handleUserInfoUpdate)
})

onUnmounted(() => {
	// 移除事件监听
	uni.$off('userInfoUpdated', handleUserInfoUpdate)
})

// 选择头像
const onChooseAvatar = (e) => {
	userInfo.value.avatarUrl = e.detail.avatarUrl
}

// 显示设置
const showSettings = () => {
	uni.showToast({
		title: '设置功能开发中',
		icon: 'none'
	})
}

// 显示客服电话弹窗
const showCustomerService = () => {
	showServicePopup.value = true
}

// 关闭弹窗
const closePopup = () => {
	showServicePopup.value = false
}

// 拨打电话
const makePhoneCall = () => {
	uni.makePhoneCall({
		phoneNumber: '192-13080447',
		fail: () => {
			uni.showToast({
				title: '拨打电话失败',
				icon: 'none'
			})
		}
	})
	closePopup()
}

// 显示帮助反馈
const showFeedback = () => {
	uni.showToast({
		title: '帮助中心开发中',
		icon: 'none'
	})
}

// 显示关于我们
const showAboutUs = () => {
    uni.showModal({
        title: '关于我们',
        content: `
让每个人都能拥有健康美丽的肌肤是我们的使命。我们的愿景是成为全球领先的痘痘诊疗服务平台。

【我们的价值观】
• 用户至上：始终以用户需求为导向，提供优质的产品和服务。
• 专业严谨：坚持科学精神，提供专业可靠的痘痘诊疗方案。
• 创新进取：不断探索新技术、新模式，推动痘痘诊疗领域的发展。
• 合作共赢：与合作伙伴携手共进，共同创造价值。

【我们的团队】
我们拥有一支充满激情和创造力的团队，成员来自互联网、医疗、人工智能等领域，具备丰富的行业经验和专业知识。我们相信，只有优秀的团队才能创造优秀的产品和服务。

【我们的产品】
皮肤诊疗小程序是我们的核心产品，集在线问诊、痘痘检测、诊疗方案、健康资讯等功能于一体，为用户提供一站式痘痘诊疗服务。

【我们的优势】
• 专业的医疗团队：平台汇聚了众多皮肤科医生，为用户提供专业的在线问诊服务。
• 先进的 AI 技术：利用人工智能技术，实现痘痘的智能识别和分析，为用户提供个性化的诊疗方案。
• 便捷的操作体验：简洁易用的界面设计，方便用户快速上手使用。
        `,
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#007AFF'
    });
};

// 页面导航
const navigateTo = (page) => {
	let url = ''
	switch (page) {
		case 'medical-records':
			url = '/pages/patient/medical-records'
			break
		case 'my-appointments':
			url = '/pages/patient/my-appointments'
			break
		case 'detection-history':
			url = '/pages/patient/detection-history'
			break
		case 'personal-info':
			url = '/pages/patient/personal-info'
			break
		default:
			url = `/pages/patient/${page}`
	}

	uni.navigateTo({
		url,
		fail: (error) => {
			console.error('页面跳转失败:', error)
			uni.showToast({
				title: '页面跳转失败',
				icon: 'none'
			})
		}
	})
}

// 格式化手机号
const formatPhone = (phone) => {
	if (!phone) return ''
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 更新页面显示的用户信息
const updatePageUserInfo = () => {
	userInfo.value = {
		avatarUrl: userInfoStore.avatarUrl,
		name: userInfoStore.name,
		phone_number: userInfoStore.phone
	}
}

// 监听用户信息更新事件
const handleUserInfoUpdate = () => {
	updatePageUserInfo()
}
</script>

<style lang="scss" scoped>
.profile-container {
	min-height: 100vh;
	background: rgba(239, 243, 248, 1);
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

	.header-right {
		display: flex;
		align-items: center;
	}
}

.user-info {
	padding: 32rpx;
	background: #FFFFFF;
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	gap: 24rpx;

	.avatar-wrapper {
		padding: 0;
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		overflow: hidden;
		flex-shrink: 0;
		background: #F5F5F5;
	}

	.avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;

		.name {
			font-size: 36rpx;
			font-weight: 500;
			color: #333333;
			margin-bottom: 8rpx;
		}

		.phone {
			font-size: 28rpx;
			color: #666666;
		}
	}
}

.main-function {
	padding: 0 24rpx;
}

.function-card {
	background: #FFFFFF;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
	padding: 32rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);

	.card-title {
		font-size: 30rpx;
		color: #333333;
		font-weight: 500;
		margin-bottom: 32rpx;
		padding-left: 8rpx;
	}
}

.function-list {
	.function-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #EEEEEE;

		&:last-child {
			border-bottom: none;
		}

		.item-left {
			display: flex;
			align-items: center;
			gap: 20rpx;

			.text-group {
				display: flex;
				flex-direction: column;

				.item-title {
					font-size: 30rpx;
					color: #333333;
				}

				.item-subtitle {
					font-size: 24rpx;
					color: #999999;
					margin-top: 6rpx;
				}
			}
		}
	}
}

.service-section {
	padding: 0 24rpx;
}

.service-list {
	.service-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #EEEEEE;

		&:last-child {
			border-bottom: none;
		}

		.service-item-left {
			display: flex;
			align-items: center;
			gap: 20rpx;

			.text-group {
				display: flex;
				flex-direction: column;

				.item-title {
					font-size: 30rpx;
					color: #333333;
				}

				.item-subtitle {
					font-size: 24rpx;
					color: #999999;
					margin-top: 6rpx;
				}
			}
		}
	}
}

.popup-content {
	background: #FFFFFF;
	border-radius: 16rpx;
	width: 600rpx;
	padding: 40rpx;

	.popup-title {
		font-size: 34rpx;
		font-weight: 500;
		color: #333333;
		text-align: center;
		margin-bottom: 16rpx;
	}

	.popup-text {
		font-size: 42rpx;
		font-weight: 500;
		color: #333333;
		text-align: center;
	}

	.popup-hint {
		color: #999999;
		font-size: 26rpx;
		margin: 20rpx 0 40rpx;
		text-align: center;
	}

	.popup-buttons {
		display: flex;
		justify-content: space-between;
		gap: 20rpx;

		.popup-btn {
			flex: 1;
			height: 80rpx;
			border-radius: 40rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 30rpx;
			margin: 0;
			padding: 0;

			&.cancel {
				background: #F5F5F5;
				color: #666666;
			}

			&.confirm {
				background: #4A90E2;
				color: #FFFFFF;
			}
		}
	}
}
</style>