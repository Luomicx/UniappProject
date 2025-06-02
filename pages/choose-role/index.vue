<template>
	<view class="choose-role-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 返回按钮 -->
		<view class="back-btn">
			<u-icon name="arrow-left" color="#333" size="20" @click="handleBack"></u-icon>
		</view>

		<!-- 标题 -->
		<view class="title">请选择身份</view>

		<!-- 角色选择按钮 -->
		<view class="role-buttons">
			<view class="role-btn doctor" @click="chooseRole('doctor')">
				<text class="label">医生</text>
				<text class="subtext">专业医疗工作者入口</text>
			</view>
			<view class="role-btn patient" @click="chooseRole('patient')">
				<text class="label">患者</text>
				<text class="subtext">患者服务入口</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { useTabBarStore } from '@/store/tabBar'
import { selectIdentity } from '@/api/auth'

const store = useTabBarStore()
const phoneNumber = ref('')

// 返回上一页
const handleBack = () => {
	uni.navigateBack({
		fail: () => {
			uni.reLaunch({
				url: '/pages/login/index'
			})
		}
	})
}

// 选择角色
const chooseRole = async (role) => {

	try {
		uni.showLoading({
			title: '加载中...',
			mask: true
		})

		// 调用选择身份接口
		const response = await selectIdentity({
			identity: role
		})

		uni.hideLoading()

		// 检查响应中是否包含用户信息
		if (response && response.id) {
			// 保存用户角色
			store.setUserRole(role)

			// 根据角色跳转到不同的首页
			const url = role === 'doctor' ? '/pages/doctor/appointments' : '/pages/patient/index'
			uni.reLaunch({
				url,
				success: () => {
					store.setCurrentPath(url)
				},
				fail: (error) => {
					console.error('跳转失败:', error)
					uni.showToast({
						title: '页面跳转失败',
						icon: 'none'
					})
				}
			})
		} else {
			throw new Error('选择身份失败：未获取到用户信息')
		}
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '操作失败',
			icon: 'none'
		})
	}
}
</script>

<style lang="scss" scoped>
.choose-role-container {
	width: 100%;
	min-height: 100vh;
	background: #f5f5f5;
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
}

.back-btn {
	position: absolute;
	left: 32rpx;
	top: calc(44px + var(--status-bar-height));
	padding: 16rpx;
	z-index: 10;
}

.title {
	font-size: 48rpx;
	color: #333;
	font-weight: 600;
	margin-top: 120rpx;
	text-align: center;
	position: relative;

	&::after {
		content: '';
		display: block;
		width: 80rpx;
		height: 4rpx;
		background: #333;
		margin: 24rpx auto;
		border-radius: 2rpx;
	}
}

.role-buttons {
	width: 100%;
	padding: 0 48rpx;
	margin-top: 80rpx;
	display: grid;
	gap: 48rpx;
}

.role-btn {
	background: #fff;
	border-radius: 24rpx;
	padding: 48rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(255, 255, 255, 0.1) 100%);
	}

	.label {
		display: block;
		font-size: 40rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}

	.subtext {
		font-size: 28rpx;
		color: #666;
	}

	&.doctor {
		border-left: 8rpx solid #5B8CFF;
	}

	&.patient {
		border-left: 8rpx solid #FF6B6B;
	}

	&:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}
}

/* 入场动画 */
.role-btn {
	opacity: 0;
	transform: translateY(40rpx);
	animation: buttonEnter 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;

	&:nth-child(1) {
		animation-delay: 0.1s;
	}

	&:nth-child(2) {
		animation-delay: 0.2s;
	}
}

@keyframes buttonEnter {
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>