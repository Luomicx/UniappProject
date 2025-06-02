<template>
	<view class="appointment-detail-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">预约详情</text>
			<view class="right"></view>
		</view>

		<!-- 详情内容 -->
		<scroll-view scroll-y class="detail-content" refresher-enabled @refresherrefresh="refreshDetail"
			:refresher-triggered="isRefreshing">
			<!-- 状态卡片 -->
			<view class="status-card">
				<text class="status-text" :class="getStatusClass(appointment.status)">{{ appointment.status }}</text>
				<text class="appointment-no">预约号：{{ appointment.appointment_number }}</text>
			</view>

			<!-- 患者信息 -->
			<view class="info-card">
				<view class="card-title">患者信息</view>
				<view class="info-item">
					<text class="label">姓名</text>
					<text class="value">{{ appointment.patient_name }}</text>
				</view>
				<view class="info-item">
					<text class="label">性别</text>
					<text class="value">{{ appointment.patient_gender }}</text>
				</view>
				<view class="info-item">
					<text class="label">年龄</text>
					<text class="value">{{ appointment.patient_age }}岁</text>
				</view>
				<view class="info-item">
					<text class="label">联系电话</text>
					<text class="value">{{ formatPhone(appointment.patient_phone_number) }}</text>
				</view>
			</view>

			<!-- 预约信息 -->
			<view class="info-card">
				<view class="card-title">预约信息</view>
				<view class="info-item">
					<text class="label">预约时间</text>
					<text class="value">{{ appointment.appointment_time }}</text>
				</view>
				<view class="info-item">
					<text class="label">就诊科室</text>
					<text class="value">{{ appointment.department }}</text>
				</view>
				<view class="info-item">
					<text class="label">就诊医生</text>
					<text class="value">{{ appointment.doctor_name }}</text>
				</view>
				<view class="info-item">
					<text class="label">挂号费</text>
					<text class="value">¥{{ appointment.registration_fee || 50 }}</text>
				</view>
				<view class="info-item">
					<text class="label">问诊费</text>
					<text class="value">¥{{ appointment.appointment_fee || 100 }}</text>
				</view>
				<view class="info-item">
					<text class="label">总费用</text>
					<text class="value highlight">¥{{ calculateTotalFee(appointment) }}</text>
				</view>
			</view>

			<!-- 就诊记录 -->
			<view class="info-card" v-if="appointment.status === '已完成'">
				<view class="card-title">就诊记录</view>
				<view class="info-item">
					<text class="label">就诊时间</text>
					<text class="value">{{ appointment.visit_time }}</text>
				</view>
				<view class="info-item">
					<text class="label">诊断结果</text>
					<text class="value">{{ appointment.diagnosis || '暂无' }}</text>
				</view>
				<view class="info-item">
					<text class="label">处方信息</text>
					<text class="value">{{ appointment.prescription || '暂无' }}</text>
				</view>
				<view class="info-item">
					<text class="label">医嘱</text>
					<text class="value">{{ appointment.medical_advice || '暂无' }}</text>
				</view>
			</view>

			<!-- 操作按钮 -->
			<view class="action-buttons" v-if="appointment.status === '待确认'">
				<button class="action-btn cancel" @click="cancelAppointment">取消预约</button>
				<button class="action-btn confirm" @click="confirmAppointment">确认预约</button>
			</view>

			<!-- 已确认状态下的操作按钮 -->
			<view class="action-buttons" v-if="appointment.status === '已确认'">
				<button class="action-btn treatment" @click="startTreatment">开始诊疗</button>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
	getAppointmentDetail,
	confirmAppointment as confirmAppointmentApi,
	cancelAppointment as cancelAppointmentApi
} from '@/api/doctor'

const props = defineProps({
	id: {
		type: String,
		required: true
	}
})

const appointment = ref({})
const isRefreshing = ref(false)

// 格式化手机号
const formatPhone = (phone) => {
	if (!phone) return ''
	return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 获取状态样式类
const getStatusClass = (status) => {
	const statusMap = {
		'待确认': 'pending',
		'已确认': 'confirmed',
		'已完成': 'completed',
		'已取消': 'cancelled'
	}
	return statusMap[status] || 'pending'
}

// 计算总费用
const calculateTotalFee = (appointment) => {
	const registrationFee = appointment.registration_fee || 50
	const appointmentFee = appointment.appointment_fee || 100
	return registrationFee + appointmentFee
}

// 获取预约详情
const fetchAppointmentDetail = async () => {
	try {
		const response = await getAppointmentDetail(props.id)
		if (response && response.data) {
			appointment.value = response.data
		} else {
			throw new Error('获取预约详情失败：无效的响应格式')
		}
	} catch (error) {
		console.error('获取预约详情失败:', error)
		uni.showToast({
			title: error.message || '获取预约详情失败',
			icon: 'none'
		})
	} finally {
		isRefreshing.value = false
	}
}

// 刷新详情
const refreshDetail = async () => {
	isRefreshing.value = true
	await fetchAppointmentDetail()
}

// 确认预约
const confirmAppointment = async () => {
	try {
		uni.showLoading({
			title: '处理中...',
			mask: true
		})

		await confirmAppointmentApi(appointment.value.doctor_id, appointment.value.appointment_number)

		uni.hideLoading()
		uni.showToast({
			title: '已确认预约',
			icon: 'success'
		})

		// 通知预约列表页面刷新数据
		uni.$emit('refreshAppointments')

		// 刷新详情
		await fetchAppointmentDetail()
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '操作失败',
			icon: 'none'
		})
	}
}

// 取消预约
const cancelAppointment = async () => {
	try {
		const result = await uni.showModal({
			title: '取消预约',
			content: '确定要取消这个预约吗？',
			confirmText: '确定',
			cancelText: '取消'
		})

		if (result.confirm) {
			uni.showLoading({
				title: '处理中...',
				mask: true
			})

			await cancelAppointmentApi(appointment.value.doctor_id, appointment.value.appointment_number)

			uni.hideLoading()
			uni.showToast({
				title: '已取消预约',
				icon: 'success'
			})

			// 通知预约列表页面刷新数据
			uni.$emit('refreshAppointments')

			// 返回上一页
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '操作失败',
			icon: 'none'
		})
	}
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

// 开始诊疗
const startTreatment = () => {
	// 通知预约列表页面刷新数据
	uni.$emit('refreshAppointments')

	// 跳转到工作台页面
	uni.navigateTo({
		url: '/pages/doctor/workbench',
		success: () => {
			// 通知工作台页面开始诊疗
			uni.$emit('treatmentAppointment')
		},
		fail: (error) => {
			console.error('跳转失败:', error)
			uni.showToast({
				title: '页面跳转失败',
				icon: 'none'
			})
		}
	})
}

onMounted(() => {
	fetchAppointmentDetail()
})
</script>

<style lang="scss" scoped>
.appointment-detail-container {
	min-height: 100vh;
	background: #F5F6FA;
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #FFFFFF;

	.left,
	.right {
		width: 80rpx;
		display: flex;
		align-items: center;
	}

	.left {
		justify-content: flex-start;
	}

	.right {
		justify-content: flex-end;
	}

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
	}
}

.detail-content {
	padding: 20rpx 32rpx;
	box-sizing: border-box;
	height: calc(100vh - 180rpx);
}

.status-card {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

	.status-text {
		font-size: 40rpx;
		font-weight: 500;
		margin-bottom: 16rpx;

		&.pending {
			color: #FF9500;
		}

		&.confirmed {
			color: #4A90E2;
		}

		&.completed {
			color: #4CD964;
		}

		&.cancelled {
			color: #FF3B30;
		}
	}

	.appointment-no {
		font-size: 28rpx;
		color: #666666;
	}
}

.info-card {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

	.card-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333333;
		margin-bottom: 24rpx;
		padding-bottom: 16rpx;
		border-bottom: 1px solid #EEEEEE;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;

		&:last-child {
			margin-bottom: 0;
		}

		.label {
			font-size: 28rpx;
			color: #666666;
		}

		.value {
			font-size: 28rpx;
			color: #333333;

			&.highlight {
				color: #FF6B6B;
				font-weight: 500;
				font-size: 32rpx;
			}
		}
	}
}

.action-buttons {
	display: flex;
	gap: 20rpx;
	margin-top: 40rpx;
	padding: 0 32rpx 40rpx;

	.action-btn {
		flex: 1;
		height: 88rpx;
		border-radius: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: 500;
		margin: 0 16rpx;
		border: none;

		&::after {
			border: none;
		}

		&.cancel {
			color: #FF3B30;
			background: rgba(255, 59, 48, 0.1);
			border: 1px solid #FF3B30;
		}

		&.confirm {
			color: #FFFFFF;
			background: #4A90E2;
		}

		&.treatment {
			color: #FFFFFF;
			background: #4CD964;
		}
	}
}
</style>