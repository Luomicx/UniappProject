<template>
	<view class="appointment-date-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" size="20"></u-icon>
			</view>
			<text class="title">选择预约时间</text>
		</view>

		<!-- 医生信息卡片 -->
		<view class="doctor-card">
			<image class="avatar" :src="doctorInfo.avatar" mode="aspectFill"></image>
			<view class="info">
				<view class="name-row">
					<text class="name">{{ doctorInfo.name }}</text>
					<u-tag :text="doctorInfo.title" type="primary" size="mini"></u-tag>
				</view>
				<text class="hospital">{{ doctorInfo.hospital }}</text>
				<text class="phone">{{ doctorInfo.phone_number }}</text>
				<text class="notice">同一个医生只能预约一次！</text>
				<!-- <text class -->
			</view>
		</view>

		<!-- 日期选择 -->
		<view class="calendar-section">
			<view class="section-title">选择日期</view>
			<scroll-view scroll-x class="date-scroll" :show-scrollbar="false">
				<view class="date-list">
					<view v-for="(date, index) in availableDates" :key="index" class="date-item"
						:class="{ active: selectedDate === date.value }" @click="selectDate(date.value)">
						<text class="day">{{ date.day }}</text>
						<text class="date">{{ date.date }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 时间段选择 -->
		<view class="time-section">
			<view class="section-title">选择时间段</view>
			<view class="time-grid">
				<view v-for="(timeSlot, index) in timeSlots" :key="index" class="time-item" :class="{
					active: selectedTime === timeSlot.value,
					disabled: !timeSlot.available
				}" @click="selectTime(timeSlot)">
					<text>{{ timeSlot.label }}</text>
					<text class="status" v-if="!timeSlot.available">已约满</text>
				</view>
			</view>
		</view>

		<!-- 费用信息 -->
		<view class="fee-info">
			<view class="fee-item">
				<text class="label">挂号费</text>
				<text class="value">¥{{ doctorInfo.registration_fee }}</text>
			</view>
			<view class="fee-item">
				<text class="label">预约费</text>
				<text class="value">¥{{ doctorInfo.appointment_fee }}</text>
			</view>
			<view class="fee-item total">
				<text class="label">总计</text>
				<text class="value">¥{{ totalFee }}</text>
			</view>
		</view>

		<!-- 确认按钮 -->
		<view class="submit-btn" :class="{ disabled: !canSubmit }" @click="handleSubmit">
			<text>确认预约</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { checkTimeSlotAvailability, createAppointment } from '@/api/appointment'
import dayjs from 'dayjs'

const doctorInfo = ref({})
const selectedDate = ref('')
const selectedTime = ref('')
const isSubmitting = ref(false)

// 生成未来7天的日期选项
const availableDates = computed(() => {
	const dates = []
	const today = dayjs()
	for (let i = 0; i < 7; i++) {
		const date = today.add(i, 'day')
		dates.push({
			value: date.format('YYYY-MM-DD'),
			day: date.format('ddd'),
			date: date.format('MM-DD')
		})
	}
	return dates
})

// 时间段选项
const timeSlots = ref([
	{ label: '09:00', value: '0900', available: true },
	{ label: '09:30', value: '0930', available: true },
	{ label: '10:00', value: '1000', available: true },
	{ label: '10:30', value: '1030', available: true },
	{ label: '11:00', value: '1100', available: true },
	{ label: '11:30', value: '1130', available: true },
	{ label: '14:00', value: '1400', available: true },
	{ label: '14:30', value: '1430', available: true },
	{ label: '15:00', value: '1500', available: true },
	{ label: '15:30', value: '1530', available: true },
	{ label: '16:00', value: '1600', available: true },
	{ label: '16:30', value: '1630', available: true }
])

// 计算总费用
const totalFee = computed(() => {
	return (doctorInfo.value.registration_fee || 0) + (doctorInfo.value.appointment_fee || 0)
})

// 是否可以提交
const canSubmit = computed(() => {
	return selectedDate.value && selectedTime.value && !isSubmitting.value
})

// 选择日期
const selectDate = async (date) => {
	selectedDate.value = date
	selectedTime.value = ''
	await checkAvailableTimeSlots(date)
}

// 选择时间
const selectTime = (timeSlot) => {
	if (!timeSlot.available) return
	selectedTime.value = timeSlot.value
}

// 检查可用时间段
const checkAvailableTimeSlots = async (date) => {
	try {
		const response = await checkTimeSlotAvailability(doctorInfo.value.id, date)
		// 更新时间段的可用状态
		timeSlots.value = timeSlots.value.map(slot => ({
			...slot,
			available: response.available_slots?.includes(slot.value) ?? true
		}))
	} catch (error) {
		console.error('获取可用时间段失败:', error)
		uni.showToast({
			title: '获取可用时间段失败',
			icon: 'none'
		})
	}
}

// 提交预约
const handleSubmit = async () => {
	if (!canSubmit.value) return

	try {
		// 检查用户角色
		const userRole = uni.getStorageSync('userRole')
		if (userRole !== 'patient') {
			uni.showToast({
				title: '只有患者才能预约',
				icon: 'none'
			})
			return
		}

		isSubmitting.value = true

		// 格式化时间
		const time = selectedTime.value.replace(/(\d{2})(\d{2})/, '$1:$2')

		const appointmentData = {
			doctor_id: doctorInfo.value.id,
			appointment_time: `${selectedDate.value} ${time}`
		}

		const response = await createAppointment(appointmentData)

		if (response && response.id) {
			uni.showToast({
				title: '预约成功',
				icon: 'success'
			})

			// 延迟跳转到预约详情页
			setTimeout(() => {
				uni.redirectTo({
					url: `/pages/patient/appointment-detail?id=${response.id}`,
					fail: (err) => {
						console.error('跳转失败:', err)
						uni.navigateBack()
					}
				})
			}, 1500)
		} else {
			throw new Error('预约失败：未获取到预约信息')
		}

	} catch (error) {
		console.error('预约失败:', error)
		uni.showToast({
			title: error.message || '预约失败',
			icon: 'none',
			duration: 2000
		})
	} finally {
		isSubmitting.value = false
	}
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

onMounted(() => {
	// 获取医生信息
	const doctor = uni.getStorageSync('selectedDoctor')
	if (!doctor) {
		uni.showToast({
			title: '未选择医生',
			icon: 'none'
		})
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
		return
	}

	doctorInfo.value = doctor
	// 默认选择今天
	selectDate(availableDates.value[0].value)
})
</script>

<style lang="scss" scoped>
.appointment-date-container {
	min-height: 100vh;
	background: #F5F6FA;
	padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	align-items: center;
	background: #FFFFFF;

	.left {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
	}

	.title {
		flex: 1;
		text-align: center;
		font-size: 36rpx;
		font-weight: 500;
		color: #333333;
		margin-right: 60rpx;
	}
}

.doctor-card {
	margin: 20rpx 32rpx;
	padding: 24rpx;
	background: #FFFFFF;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;

	.avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50rpx;
	}

	.info {
		flex: 1;

		.name-row {
			display: flex;
			align-items: center;
			gap: 12rpx;
			margin-bottom: 8rpx;

			.name {
				font-size: 32rpx;
				font-weight: 500;
				color: #333333;
			}
		}

		.hospital {
			font-size: 28rpx;
			color: #666666;
		}

		.phone {
			font-size: 28rpx;
			color: #666666;
			display: block;
			margin-bottom: 8rpx;
		}

		.notice {
			font-size: 28rpx;
			color: red;
			display: block;
		}

	}
}

.calendar-section,
.time-section {
	margin: 20rpx 32rpx;
	padding: 24rpx;
	background: #FFFFFF;
	border-radius: 16rpx;

	.section-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333333;
		margin-bottom: 24rpx;
	}
}

.date-scroll {
	white-space: nowrap;

	.date-list {
		display: inline-flex;
		padding: 0 16rpx;

		.date-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 120rpx;
			height: 120rpx;
			margin-right: 20rpx;
			border-radius: 12rpx;
			background: #F5F6FA;

			&.active {
				background: #4A90E2;

				.day,
				.date {
					color: #FFFFFF;
				}
			}

			.day {
				font-size: 24rpx;
				color: #666666;
				margin-bottom: 8rpx;
			}

			.date {
				font-size: 28rpx;
				color: #333333;
				font-weight: 500;
			}
		}
	}
}

.time-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;

	.time-item {
		height: 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #F5F6FA;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #333333;

		&.active {
			background: #4A90E2;
			color: #FFFFFF;

			.status {
				color: rgba(255, 255, 255, 0.8);
			}
		}

		&.disabled {
			background: #F5F5F5;
			color: #999999;
		}

		.status {
			font-size: 24rpx;
			color: #999999;
			margin-top: 4rpx;
		}
	}
}

.fee-info {
	margin: 20rpx 32rpx;
	padding: 24rpx;
	background: #FFFFFF;
	border-radius: 16rpx;

	.fee-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;

		&:last-child {
			margin-bottom: 0;
			padding-top: 16rpx;
			border-top: 1px solid #EEEEEE;
		}

		.label {
			font-size: 28rpx;
			color: #666666;
		}

		.value {
			font-size: 28rpx;
			color: #333333;
			font-weight: 500;
		}

		&.total {

			.label,
			.value {
				font-size: 32rpx;
				color: #333333;
				font-weight: 500;
			}

			.value {
				color: #FF3B30;
			}
		}
	}
}

.submit-btn {
	position: fixed;
	left: 32rpx;
	right: 32rpx;
	bottom: calc(32rpx + env(safe-area-inset-bottom));
	height: 88rpx;
	background: #4A90E2;
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	color: #FFFFFF;
	font-weight: 500;

	&.disabled {
		opacity: 0.5;
	}
}
</style>