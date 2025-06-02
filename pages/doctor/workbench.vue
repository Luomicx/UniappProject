<template>
	<view class="workbench-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 医生状态面板 -->
		<view class="doctor-status-panel">
			<view class="left-section">
				<view class="doctor-info">
					<text class="doctor-name">{{ doctorInfo.name || '医生' }}</text>
					<text class="doctor-title">{{ doctorInfo.title || '医师' }}</text>
				</view>
				<view class="appointment-count">
					<text class="count-label">待处理预约：</text>
					<text class="count-number">{{ doctorInfo.appointment_count || 0 }}</text>
				</view>
			</view>
			<view class="right-section">
				<view class="current-time">{{ currentTime }}</view>
				<view class="refresh-btn" @click="refreshAppointment">
					<u-icon name="reload" color="#4A90E2" size="18"></u-icon>
					<text>刷新队列</text>
				</view>
			</view>
		</view>

		<!-- 主要内容区域 -->
		<view class="main-content">
			<!-- 无预约状态 -->
			<view v-if="!currentAppointment" class="no-appointment">
				<image src="/static/images/no-appointment.png" mode="aspectFit" class="empty-image"></image>
				<text class="empty-text">当前没有待处理预约</text>
				<text class="empty-subtext">您可以点击"刷新队列"按钮查看最新预约</text>
			</view>

			<!-- 当前预约卡片 -->
			<view v-else class="appointment-card">
				<view class="card-header">
					<text class="header-title">当前待处理预约</text>
					<text class="appointment-time">{{ formatDateTime(currentAppointment.appointment_time) }}</text>
				</view>

				<view class="patient-info">
					<!-- <view class="info-row">
						<text class="info-label">患者姓名：</text>
						<text class="info-value">{{ currentAppointment.patient_name }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">性别/年龄：</text>
						<text class="info-value">{{ currentAppointment.gender }} / {{ currentAppointment.age }}岁</text>
					</view>
					<view class="info-row">
						<text class="info-label">联系方式：</text>
						<text class="info-value">{{ maskPhoneNumber(currentAppointment.phone_number) }}</text>
					</view> -->
					<view class="info-row">
						<text class="info-label">预约号：</text>
						<text class="info-value">{{ currentAppointment.appointment_number }}</text>
					</view>
				</view>

				<!-- 诊疗建议输入区 -->
				<view class="diagnosis-input-area">
					<view class="input-header">
						<text class="input-title">诊疗建议</text>
						<text class="word-count" :class="{ 'word-count-warning': adviceText.length > 450 }">
							{{ adviceText.length }}/500
						</text>
					</view>
					<textarea class="advice-textarea" v-model="adviceText" placeholder="请输入诊疗建议（如用药指导、复查提醒等）"
						:maxlength="500" @input="onTextareaInput"></textarea>
					<view class="markdown-tips">
						<text>支持Markdown格式：**加粗文本** *斜体文本* - 列表项</text>
					</view>
				</view>

				<!-- 提交按钮 -->
				<view class="submit-btn-area">
					<view class="submit-btn" :class="{ 'btn-disabled': isSubmitting || !adviceText.trim() }"
						@click="submitAdvice">
						<text v-if="!isSubmitting">提交诊疗建议</text>
						<view v-else class="loading-icon">
							<u-loading-icon color="#FFFFFF" size="24"></u-loading-icon>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部导航占位 -->
		<view class="tab-bar-placeholder"></view>

		<!-- 底部导航栏 -->
		<doctor-tab-bar></doctor-tab-bar>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getAppointmentList, submitDiagnosisAdvice } from '@/api/doctor'
import DoctorTabBar from '@/components/doctor-tab-bar.vue'

// 医生信息
const doctorInfo = ref({
	name: '',
	title: '',
	appointment_count: 0
})

// 当前时间
const currentTime = ref('')
let timeInterval = null

// 当前预约
const currentAppointment = ref(null)

// 诊疗建议文本
const adviceText = ref('')

// 提交状态
const isSubmitting = ref(false)

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
	if (!dateTimeStr) return ''

	const date = new Date(dateTimeStr)
	if (isNaN(date.getTime())) return dateTimeStr

	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 手机号脱敏
const maskPhoneNumber = (phone) => {
	if (!phone) return ''
	if (phone.length !== 11) return phone

	return `${phone.substring(0, 3)}****${phone.substring(7)}`
}

// 更新当前时间
const updateCurrentTime = () => {
	const now = new Date()
	const hours = String(now.getHours()).padStart(2, '0')
	const minutes = String(now.getMinutes()).padStart(2, '0')
	const seconds = String(now.getSeconds()).padStart(2, '0')
	currentTime.value = `${hours}:${minutes}:${seconds}`
}

// 获取医生信息
const getDoctorInfo = () => {
	try {
		const userInfo = uni.getStorageSync('userInfo')
		if (userInfo) {
			doctorInfo.value = {
				name: userInfo.name || '医生',
				title: userInfo.title || '医师',
				appointment_count: userInfo.appointment_count || 0
			}
		}
	} catch (e) {
		console.error('获取医生信息失败:', e)
	}
}

// 获取预约列表并显示第一个待处理预约
const fetchAppointments = async () => {
	try {
		uni.showLoading({
			title: '加载中...',
			mask: true
		})

		const response = await getAppointmentList()

		if (response && response.length > 0) {
			currentAppointment.value = response[0]
		} else {
			currentAppointment.value = null
		}

		// 更新医生信息中的待处理预约数量
		if (doctorInfo.value) {
			doctorInfo.value.appointment_count = response?.length || 0
		}
	} catch (error) {
		console.error('获取待处理预约失败:', error)
		uni.showToast({
			title: '获取预约失败',
			icon: 'none'
		})
		currentAppointment.value = null
	} finally {
		uni.hideLoading()
	}
}

// 监听从预约详情页面传来的开始诊疗请求
const listenForAppointment = () => {
	uni.$on('treatmentAppointment', () => {
		console.log('接收到开始诊疗请求')
		// 直接调用获取预约接口，后端会自动处理队列
		fetchAppointments()
	})
}

// 刷新预约
const refreshAppointment = () => {
	adviceText.value = ''
	fetchAppointments()
}

// 文本输入处理
const onTextareaInput = (e) => {
	// 可以在这里添加额外的文本处理逻辑
}

// 提交诊疗建议
const submitAdvice = async () => {
	if (!currentAppointment.value || !currentAppointment.value.id) {
		uni.showToast({
			title: '没有待处理的预约',
			icon: 'none'
		})
		return
	}

	if (!adviceText.value.trim()) {
		uni.showToast({
			title: '请输入诊疗建议',
			icon: 'none'
		})
		return
	}

	if (isSubmitting.value) return

	isSubmitting.value = true

	try {
		await submitDiagnosisAdvice({
			cure_description: adviceText.value.trim()
		})

		uni.showToast({
			title: `已成功处理${currentAppointment.value.patient_name}的预约`,
			icon: 'success',
			duration: 2000
		})

		// 清空当前预约和建议文本
		setTimeout(() => {
			adviceText.value = ''
			fetchAppointments()
		}, 2000)
	} catch (error) {
		console.error('提交诊疗建议失败:', error)
		uni.showToast({
			title: error.message || '提交失败',
			icon: 'none'
		})
	} finally {
		isSubmitting.value = false
	}
}

// 生命周期钩子
onMounted(() => {
	// 获取医生信息
	getDoctorInfo()

	// 初始化时间并设置定时器
	updateCurrentTime()
	timeInterval = setInterval(updateCurrentTime, 1000)

	// 获取预约列表
	fetchAppointments()

	// 监听从预约详情页面传来的开始诊疗请求
	listenForAppointment()
})

onUnmounted(() => {
	// 清除定时器
	if (timeInterval) {
		clearInterval(timeInterval)
	}

	// 移除事件监听
	uni.$off('treatmentAppointment')
})
</script>

<style lang="scss" scoped>
.workbench-container {
	min-height: 100vh;
	background-color: #F5F6FA;
	display: flex;
	flex-direction: column;
}

/* 医生状态面板 */
.doctor-status-panel {
	background-color: #FFFFFF;
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

	.left-section {
		.doctor-info {
			display: flex;
			align-items: center;
			margin-bottom: 8rpx;

			.doctor-name {
				font-size: 32rpx;
				font-weight: 600;
				color: #333333;
				margin-right: 12rpx;
			}

			.doctor-title {
				font-size: 24rpx;
				color: #666666;
				background: #F5F6FA;
				padding: 4rpx 12rpx;
				border-radius: 4rpx;
			}
		}

		.appointment-count {
			font-size: 26rpx;
			color: #666666;

			.count-number {
				color: #4A90E2;
				font-weight: 500;
			}
		}
	}

	.right-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;

		.current-time {
			font-size: 28rpx;
			color: #333333;
			font-weight: 500;
			margin-bottom: 8rpx;
		}

		.refresh-btn {
			display: flex;
			align-items: center;
			background: rgba(74, 144, 226, 0.1);
			padding: 6rpx 16rpx;
			border-radius: 30rpx;

			text {
				font-size: 24rpx;
				color: #4A90E2;
				margin-left: 6rpx;
			}

			&:active {
				opacity: 0.8;
			}
		}
	}
}

/* 主要内容区域 */
.main-content {
	flex: 1;
	padding: 32rpx;

	/* 无预约状态 */
	.no-appointment {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 0;

		.empty-image {
			width: 300rpx;
			height: 300rpx;
			margin-bottom: 40rpx;
		}

		.empty-text {
			font-size: 32rpx;
			color: #333333;
			font-weight: 500;
			margin-bottom: 16rpx;
		}

		.empty-subtext {
			font-size: 26rpx;
			color: #999999;
		}
	}

	/* 当前预约卡片 */
	.appointment-card {
		background: #FFFFFF;
		border-radius: 24rpx;
		padding: 32rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

		.card-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 24rpx;

			.header-title {
				font-size: 32rpx;
				font-weight: 600;
				color: #333333;
			}

			.appointment-time {
				font-size: 28rpx;
				color: #4A90E2;
				font-weight: 500;
			}
		}

		.patient-info {
			background: #F8F9FC;
			border-radius: 16rpx;
			padding: 24rpx;
			margin-bottom: 32rpx;

			.info-row {
				display: flex;
				margin-bottom: 16rpx;

				&:last-child {
					margin-bottom: 0;
				}

				.info-label {
					width: 160rpx;
					font-size: 28rpx;
					color: #666666;
				}

				.info-value {
					flex: 1;
					font-size: 28rpx;
					color: #333333;
					font-weight: 500;
				}
			}
		}

		/* 诊疗建议输入区 */
		.diagnosis-input-area {
			margin-bottom: 32rpx;

			.input-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 16rpx;

				.input-title {
					font-size: 30rpx;
					font-weight: 600;
					color: #333333;
				}

				.word-count {
					font-size: 24rpx;
					color: #999999;

					&.word-count-warning {
						color: #FF9500;
					}
				}
			}

			.advice-textarea {
				width: 100%;
				height: 300rpx;
				background: #F8F9FC;
				border-radius: 16rpx;
				padding: 24rpx;
				font-size: 28rpx;
				color: #333333;
				box-sizing: border-box;
			}

			.markdown-tips {
				margin-top: 12rpx;
				font-size: 24rpx;
				color: #999999;
			}
		}

		/* 提交按钮 */
		.submit-btn-area {
			display: flex;
			justify-content: center;

			.submit-btn {
				width: 80%;
				height: 88rpx;
				background: #4A90E2;
				border-radius: 44rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 32rpx;
				color: #FFFFFF;
				font-weight: 500;
				box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.3);
				transition: all 0.3s;

				&:active {
					transform: scale(0.98);
					box-shadow: 0 2rpx 8rpx rgba(74, 144, 226, 0.2);
				}

				&.btn-disabled {
					background: #CCCCCC;
					box-shadow: none;

					&:active {
						transform: none;
					}
				}

				.loading-icon {
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}
		}
	}
}

/* 底部导航占位 */
.tab-bar-placeholder {
	height: 100rpx;
}

/* 动画效果 */
@keyframes breathe {
	0% {
		opacity: 0.6;
	}

	50% {
		opacity: 1;
	}

	100% {
		opacity: 0.6;
	}
}
</style>