<template>
	<view class="appointment-detail-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left">
				<u-icon name="arrow-left" size="20" @click="handleBack"></u-icon>
			</view>
			<text class="title">预约详情</text>
			<view class="right"></view>
		</view>

		<!-- 预约状态 -->
		<view class="status-section">
			<text class="status-text" :class="getStatusClass(appointmentDetail.status)">
				{{ appointmentDetail.status }}
			</text>
		</view>

		<!-- 医生信息 -->
		<view class="doctor-card">
			<image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
			<view class="info">
				<view class="name-row">
					<text class="name">{{ appointmentDetail.doctor_name }}</text>
					<text class="phone">{{ appointmentDetail.doctor_phone_number }}</text>
				</view>
			</view>
		</view>

		<!-- 预约信息 -->
		<view class="info-card">
			<view class="info-item">
				<text class="label">预约时间</text>
				<text class="value">{{ appointmentDetail.appointment_time }}</text>
			</view>
			<view class="info-item">
				<text class="label">预约号</text>
				<text class="value">{{ appointmentDetail.appointment_number }}</text>
			</view>
			<view class="info-item">
				<text class="label">就诊人</text>
				<text class="value">{{ appointmentDetail.patient_name || '未设置' }}</text>
			</view>
			<view class="info-item">
				<text class="label">联系电话</text>
				<text class="value">{{ appointmentDetail.patient_phone_number }}</text>
			</view>
			<view class="info-item">
				<text class="label">挂号费</text>
				<text class="value">¥{{ appointmentDetail.registration_fee || 50 }}</text>
			</view>
			<view class="info-item">
				<text class="label">预约费</text>
				<text class="value">¥{{ appointmentDetail.appointment_fee || 100 }}</text>
			</view>
			<view class="info-item">
				<text class="label">总费用</text>
				<text class="value highlight">¥{{ getTotalFee }}</text>
			</view>
		</view>

		<!-- 注意事项 -->
		<view class="section">
			<view class="section-title">注意事项</view>
			<view class="notice-content">
				<view class="notice-item" v-for="(item, index) in noticeList" :key="index">
					{{ item }}
				</view>
			</view>
		</view>

		<!-- 底部按钮 -->
		<view class="bottom-btn" v-if="appointmentDetail.status === '待就诊'">
			<button class="cancel-btn" @click="handleCancel">取消预约</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAppointmentDetail, cancelAppointment } from '@/api/appointment'

const appointmentDetail = ref({
	doctor_name: '',
	doctor_phone_number: '',
	patient_name: '',
	patient_phone_number: '',
	appointment_time: '',
	appointment_number: '',
	status: '待就诊', // 默认状态
	registration_fee: 0,
	appointment_fee: 0
})

const noticeList = [
	'1. 请您按照预约时间准时就诊，迟到超过15分钟将自动取消预约。',
	'2. 就诊前请准备好有效身份证件。',
	'3. 如需取消预约，请提前24小时操作。',
	'4. 就诊当天请避免空腹。',
	'5. 如有不适，建议提前进行线上咨询。'
]

// 计算总费用
const getTotalFee = computed(() => {
	return (appointmentDetail.value.registration_fee || 50) + (appointmentDetail.value.appointment_fee || 100)
})

// 获取状态样式类
const getStatusClass = (status) => {
	switch (status) {
		case '待就诊':
			return 'status-pending'
		case '已完成':
			return 'status-completed'
		case '已取消':
			return 'status-cancelled'
		default:
			return ''
	}
}

// 获取预约详情
const fetchAppointmentDetail = async () => {
	try {
		const appointmentId = getAppointmentIdFromRoute()
		if (!appointmentId) {
			throw new Error('未找到预约ID')
		}

		const response = await getAppointmentDetail(appointmentId)
		if (response.code === 200 && response.data) {
			appointmentDetail.value = {
				...response.data,
				status: '待就诊' // 由于API返回数据中没有状态字段，暂时默认为待就诊
			}
		} else {
			throw new Error('获取预约详情失败')
		}
	} catch (error) {
		console.error('获取预约详情失败:', error)
		uni.showToast({
			title: error.message || '获取预约详情失败',
			icon: 'none'
		})
	}
}

// 从路由中获取预约ID
const getAppointmentIdFromRoute = () => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	return currentPage.options?.id
}

// 取消预约
const handleCancel = () => {
	uni.showModal({
		title: '提示',
		content: '确定要取消该预约吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					await cancelAppointment(appointmentDetail.value.doctor_id, appointmentDetail.value.appointment_number)

					uni.showToast({
						title: '取消成功',
						icon: 'success'
					})

					// 延迟返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} catch (error) {
					uni.showToast({
						title: error.message || '取消预约失败',
						icon: 'none'
					})
				}
			}
		}
	})
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

onMounted(() => {
	fetchAppointmentDetail()
})
</script>

<style lang="scss" scoped>
.appointment-detail-container {
	min-height: 100vh;
	background: #F5F6FA;
	padding-bottom: env(safe-area-inset-bottom);
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #FFFFFF;

	.left,
	.right {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
	}
}

.status-section {
	padding: 32rpx;
	background: #FFFFFF;
	display: flex;
	justify-content: center;
	margin-bottom: 20rpx;

	.status-text {
		font-size: 32rpx;
		font-weight: 500;
		padding: 8rpx 32rpx;
		border-radius: 32rpx;

		&.status-pending {
			color: #FF9500;
			background: rgba(255, 149, 0, 0.1);
		}

		&.status-completed {
			color: #4CD964;
			background: rgba(76, 217, 100, 0.1);
		}

		&.status-cancelled {
			color: #FF3B30;
			background: rgba(255, 59, 48, 0.1);
		}
	}
}

.doctor-card {
	margin: 0 32rpx;
	padding: 32rpx;
	background: #FFFFFF;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;

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
				font-size: 32rpx;
				font-weight: 500;
				color: #333333;
				margin-right: 16rpx;
			}

			.phone {
				font-size: 28rpx;
				color: #666666;
			}
		}
	}
}

.info-card {
	margin: 0 32rpx;
	padding: 32rpx;
	background: #FFFFFF;
	border-radius: 16rpx;

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;

		&:last-child {
			margin-bottom: 0;
			padding-top: 24rpx;
			border-top: 1px solid #EEEEEE;
		}

		.label {
			font-size: 28rpx;
			color: #666666;
		}

		.value {
			font-size: 28rpx;
			color: #333333;

			&.highlight {
				font-size: 32rpx;
				font-weight: 500;
				color: #FF3B30;
			}
		}
	}
}

.section {
	background: #FFFFFF;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 32rpx;

	.section-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333333;
		margin-bottom: 24rpx;
	}
}

.notice-content {
	.notice-item {
		font-size: 28rpx;
		color: #666666;
		line-height: 1.6;
		margin-bottom: 16rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}
}

.bottom-btn {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 32rpx;
	background: #FFFFFF;
	box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);

	.cancel-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: #FF3B30;
		color: #FFFFFF;
		font-size: 32rpx;
		font-weight: 500;
		border-radius: 44rpx;
		text-align: center;
	}
}
</style>