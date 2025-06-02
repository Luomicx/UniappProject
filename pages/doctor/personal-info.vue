<template>
	<view class="doctor-info">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 返回按钮和标题 -->
		<view class="header">
			<view class="back-btn" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">完善个人信息</text>
		</view>

		<!-- 表单区域 -->
		<view class="form-section">
			<!-- 基本信息 -->
			<view class="form-group">
				<view class="form-title">基本信息</view>
				<u-form :model="formData" ref="uForm">
					<u-form-item label="姓名" required>
						<u-input v-model="formData.name" placeholder="请输入姓名" />
					</u-form-item>
					<u-form-item label="性别" required>
						<u-radio-group v-model="formData.gender">
							<u-radio label="男" name="男"></u-radio>
							<u-radio label="女" name="女"></u-radio>
						</u-radio-group>
					</u-form-item>
					<u-form-item label="医院" required>
						<u-input v-model="formData.hospital" placeholder="请输入医院名称" />
					</u-form-item>
					<u-form-item label="职称" required>
						<u-input v-model="formData.title" placeholder="请输入职称" />
					</u-form-item>
					<u-form-item label="从业年限" required>
						<view class="number-input-wrapper">
							<view class="number-btn" @click="decreaseYears">
								<u-icon name="minus" size="14"></u-icon>
							</view>
							<input type="number" v-model="formData.working_years" class="number-input"
								:disabled="true" />
							<view class="number-btn" @click="increaseYears">
								<u-icon name="plus" size="14"></u-icon>
							</view>
						</view>
					</u-form-item>
				</u-form>
			</view>

			<!-- 专业信息 -->
			<view class="form-group">
				<view class="form-title">专业信息</view>
				<u-form :model="formData" ref="uForm2">
					<u-form-item label="专长" required>
						<u-input v-model="formData.expertise" type="textarea" placeholder="请输入专业特长" />
					</u-form-item>
					<u-form-item label="个人简介" required>
						<u-input v-model="formData.introduction" type="textarea" placeholder="请输入个人简介" />
					</u-form-item>
					<u-form-item label="执业证号" required>
						<u-input v-model="formData.profession_number" placeholder="请输入执业证号" />
					</u-form-item>
				</u-form>
			</view>

			<!-- 收费信息 -->
			<view class="form-group">
				<view class="form-title">收费信息</view>
				<u-form :model="formData" ref="uForm3">
					<u-form-item label="挂号费" required>
						<u-input v-model="formData.registration_fee" type="number" placeholder="请输入挂号费" />
					</u-form-item>
					<!-- <u-form-item label="收款码">
						<view class="upload-section">
							<image v-if="formData.payment_qr_code" :src="formData.payment_qr_code" mode="aspectFit"
								class="preview-image" @click="previewImage"></image>
							<view v-else class="upload-btn" @click="chooseImage">
								<u-icon name="camera" size="40"></u-icon>
								<text>上传收款码</text>
							</view>
						</view>
					</u-form-item> -->
				</u-form>
			</view>

			<!-- 联系方式 -->
			<view class="form-group">
				<view class="form-title">联系方式</view>
				<u-form :model="formData" ref="uForm4">
					<u-form-item label="手机号码" required>
						<u-input v-model="formData.phone_number" type="number" placeholder="请输入手机号码" />
					</u-form-item>
				</u-form>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-btn" @click="handleSubmit">保存信息</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { updateDoctorInfo, uploadDoctorImage } from '@/api/doctor'

// 表单数据
const formData = ref({
	name: '',
	gender: '男',
	hospital: '',
	title: '',
	working_years: 0,
	expertise: '',
	introduction: '',
	profession_number: '',
	registration_fee: '',
	payment_qr_code: '',
	phone_number: '',
	appointment_count: 0,
	image: ''
})

// 选择图片
const chooseImage = async () => {
	try {
		const res = await uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			sourceType: ['album', 'camera']
		})

		// 上传图片
		const tempFilePath = res.tempFilePaths[0]

		// 显示临时图片
		formData.value.payment_qr_code = tempFilePath

		// 上传到服务器
		const uploadRes = await uploadDoctorImage(tempFilePath, 'payment_qr')
		if (uploadRes.code === 200 && uploadRes.data) {
			formData.value.payment_qr_code = uploadRes.data.url
		} else {
			throw new Error('上传失败')
		}
	} catch (error) {
		console.error('选择或上传图片失败:', error)
		uni.showToast({
			title: '上传图片失败',
			icon: 'none'
		})
	}
}

// 预览图片
const previewImage = () => {
	if (formData.value.payment_qr_code) {
		uni.previewImage({
			urls: [formData.value.payment_qr_code]
		})
	}
}

// 提交表单
const handleSubmit = async () => {
	// 表单验证
	if (!formData.value.name || !formData.value.hospital || !formData.value.title ||
		!formData.value.expertise || !formData.value.introduction ||
		!formData.value.phone_number) {
		uni.showToast({
			title: '请填写完整信息',
			icon: 'none'
		})
		return
	}

	try {
		uni.showLoading({
			title: '保存中...',
			mask: true
		})

		// 只提交医生信息相关的字段，并确保类型正确
		const submitData = {
			name: formData.value.name,
			gender: formData.value.gender,
			hospital: formData.value.hospital,
			title: formData.value.title,
			working_years: parseInt(formData.value.working_years || 0),
			expertise: formData.value.expertise || '',
			introduction: formData.value.introduction || '',
			registration_fee: parseInt(formData.value.registration_fee || 0),
			phone_number: formData.value.phone_number
		}

		const response = await updateDoctorInfo(submitData)

		uni.hideLoading()

		if (response.code === 200 && response.data) {
			// 更新本地存储的用户信息，只更新医生相关字段
			const currentUserInfo = uni.getStorageSync('userInfo') || {}
			const updatedUserInfo = {
				...currentUserInfo,
				...response.data
			}
			uni.setStorageSync('userInfo', updatedUserInfo)

			uni.showToast({
				title: '保存成功',
				icon: 'success'
			})

			// 延迟返回
			setTimeout(() => {
				handleBack()
			}, 1500)
		} else {
			throw new Error(response.message || '保存失败')
		}
	} catch (error) {
		uni.hideLoading()
		console.error('保存失败:', error)
		uni.showToast({
			title: error.message || '保存失败',
			icon: 'none'
		})
	}
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

// 页面加载时获取现有信息
onMounted(async () => {
	try {
		// 获取当前用户信息
		const userInfo = uni.getStorageSync('userInfo')
		if (userInfo) {
			// 预填充表单
			Object.assign(formData.value, userInfo)
		}
	} catch (error) {
		console.error('获取用户信息失败:', error)
		uni.showToast({
			title: '获取信息失败',
			icon: 'none'
		})
	}
})

// 增加年限
const increaseYears = () => {
	if (formData.value.working_years < 50) {
		formData.value.working_years++
	}
}

// 减少年限
const decreaseYears = () => {
	if (formData.value.working_years > 0) {
		formData.value.working_years--
	}
}
</script>

<style lang="scss" scoped>
.doctor-info {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 120rpx;

	.header {
		background: #fff;
		padding: 20rpx 40rpx;
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;

		.back-btn {
			margin-right: 20rpx;
		}

		.title {
			font-size: 36rpx;
			font-weight: 600;
			color: #333;
		}
	}

	.form-section {
		padding: 0 20rpx;

		.form-group {
			background: #fff;
			border-radius: 12rpx;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.form-title {
				font-size: 30rpx;
				font-weight: 600;
				color: #333;
				margin-bottom: 30rpx;
				border-left: 8rpx solid #007AFF;
				padding-left: 20rpx;
			}
		}
	}

	.upload-section {
		.preview-image {
			width: 200rpx;
			height: 200rpx;
			border-radius: 12rpx;
		}

		.upload-btn {
			width: 200rpx;
			height: 200rpx;
			background: #f8f8f8;
			border-radius: 12rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			color: #999;

			text {
				font-size: 24rpx;
				margin-top: 10rpx;
			}
		}
	}

	.submit-btn {
		position: fixed;
		bottom: 40rpx;
		left: 40rpx;
		right: 40rpx;
		height: 88rpx;
		background: #007AFF;
		color: #fff;
		border-radius: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: 500;
		box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.3);

		&:active {
			transform: scale(0.98);
		}
	}

	.number-input-wrapper {
		display: flex;
		align-items: center;
		border: 1px solid #dcdfe6;
		border-radius: 4px;
		width: fit-content;

		.number-btn {
			width: 35px;
			height: 35px;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: #f5f7fa;
			cursor: pointer;

			&:active {
				background-color: #e4e7ed;
			}
		}

		.number-input {
			width: 50px;
			height: 35px;
			text-align: center;
			border: none;
			border-left: 1px solid #dcdfe6;
			border-right: 1px solid #dcdfe6;
			background-color: #fff;
		}
	}
}
</style>