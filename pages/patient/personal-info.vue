<template>
	<view class="personal-info-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left">
				<u-icon name="arrow-left" color="#FFFFFF" size="20" @click="handleBack"></u-icon>
			</view>
			<text class="title">填写信息</text>
			<view class="right"></view>
		</view>

		<!-- 头像区域 -->
		<view class="avatar-section">
			<button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
				<image class="avatar" :src="formData.avatarUrl" mode="aspectFill"></image>
			</button>
		</view>

		<!-- 表单区域 -->
		<view class="form-section">
			<u-form :model="formData" ref="uForm" :rules="rules">
				<u-form-item label="姓名" required>
					<u-input v-model="formData.name" placeholder="请输入姓名" />
				</u-form-item>
				<u-form-item label="性别" required>
					<u-radio-group v-model="formData.gender">
						<u-radio label="男" name="男"></u-radio>
						<u-radio label="女" name="女"></u-radio>
					</u-radio-group>
				</u-form-item>
				<u-form-item label="年龄" required>
					<u-input v-model="formData.age" placeholder="请输入年龄" type="number" />
				</u-form-item>
				<u-form-item label="身份证号">
					<u-input v-model="formData.id_card" placeholder="请输入身份证号" maxlength="18" @blur="validateIdCard" />
				</u-form-item>
				<u-form-item label="出生日期">
					<u-input v-model="formData.birth_date" placeholder="格式：YYYY-MM-DD" @blur="validateBirthDate" />
				</u-form-item>
				<u-form-item label="婚姻状况">
					<u-radio-group v-model="formData.marital_status">
						<u-radio label="未婚" name="single"></u-radio>
						<u-radio label="已婚" name="married"></u-radio>
						<u-radio label="离异" name="divorced"></u-radio>
						<u-radio label="丧偶" name="widowed"></u-radio>
					</u-radio-group>
				</u-form-item>
				<u-form-item label="民族">
					<u-input v-model="formData.ethnicity" placeholder="请输入民族" />
				</u-form-item>
				<u-form-item label="手机号" required>
					<u-input v-model="formData.phone" placeholder="请输入手机号" type="number" maxlength="11"
						@blur="validatePhone" />
				</u-form-item>
				<u-form-item label="居住地" required>
					<textarea class="address-input" v-model="formData.address" placeholder="请输入详细的居住地址"
						maxlength="100" />
					<text class="address-count">{{ formData.address.length }}/100</text>
				</u-form-item>
			</u-form>
		</view>

		<!-- 保存按钮 -->
		<view class="submit-btn">
			<button class="btn" @click="submitForm">保存</button>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserInfoStore } from '@/stores/userInfo'

const userInfoStore = useUserInfoStore()
const formData = ref({
	avatarUrl: '/static/images/default-avatar.png',
	name: '',
	gender: '男',
	age: '',
	phone: '',
	address: '',
	id_card: '',
	marital_status: 'single',
	ethnicity: '',
	birth_date: ''
})

const rules = {
	name: [{
		required: true,
		message: '请输入姓名',
		trigger: ['blur', 'change']
	}],
	gender: [{
		required: true,
		message: '请选择性别',
		trigger: ['blur', 'change']
	}],
	age: [{
		required: true,
		message: '请输入年龄',
		trigger: ['blur', 'change']
	}],
	phone: [{
		required: true,
		message: '请输入手机号',
		trigger: ['blur', 'change']
	}, {
		pattern: /^1[3-9]\d{9}$/,
		message: '请输入正确的手机号',
		trigger: 'blur'
	}],
	address: [{
		required: true,
		message: '请输入居住地址',
		trigger: ['blur', 'change']
	}, {
		min: 5,
		message: '地址至少需要5个字符',
		trigger: 'blur'
	}]
}

const uForm = ref(null)

// 提交表单方法
const submitForm = async () => {
	// 基本验证
	if (!formData.value.name) {
		uni.showToast({
			title: '请输入姓名',
			icon: 'none'
		})
		return
	}

	if (!formData.value.age) {
		uni.showToast({
			title: '请输入年龄',
			icon: 'none'
		})
		return
	}

	if (!formData.value.phone) {
		uni.showToast({
			title: '请输入手机号',
			icon: 'none'
		})
		return
	}

	if (!/^1[3-9]\d{9}$/.test(formData.value.phone)) {
		uni.showToast({
			title: '请输入正确的手机号',
			icon: 'none'
		})
		return
	}

	if (!formData.value.address || formData.value.address.length < 5) {
		uni.showToast({
			title: '请输入至少5个字符的地址',
			icon: 'none'
		})
		return
	}

	// 显示加载状态
	uni.showLoading({
		title: '保存中...',
		mask: true
	})

	try {
		// 调用store的saveToBackend方法保存到后端
		await userInfoStore.saveToBackend({
			avatarUrl: formData.value.avatarUrl,
			name: formData.value.name,
			gender: formData.value.gender,
			age: formData.value.age,
			phone: formData.value.phone,
			address: formData.value.address,
			id_card: formData.value.id_card,
			marital_status: formData.value.marital_status,
			ethnicity: formData.value.ethnicity,
			birth_date: formData.value.birth_date
		})
		

		// 隐藏加载状态
		uni.hideLoading()

		// 显示成功提示
		uni.showToast({
			title: '保存成功',
			icon: 'success',
			duration: 1500
		})

		// 延迟返回上一页
		setTimeout(() => {
			uni.navigateBack({
				delta: 1,
				success: () => {
					// 触发用户信息更新事件，更新个人中心页面
					uni.$emit('userInfoUpdated')
				}
			})
		}, 1500)

	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: '保存失败，请重试',
			icon: 'none',
			duration: 2000
		})
	}
}

// 在页面加载时获取已保存的数据
onMounted(async () => {
	// 显示加载状态
	uni.showLoading({
		title: '加载中...',
		mask: true
	})

	try {
		// 从后端获取用户信息
		await userInfoStore.fetchUserInfo()

		// 从store中获取数据
		formData.value = {
			avatarUrl: userInfoStore.avatarUrl || '/static/default-avatar.png',
			name: userInfoStore.name || '',
			gender: userInfoStore.gender || '男',
			age: userInfoStore.age || '',
			phone: userInfoStore.phone || '',
			address: userInfoStore.address || '',
			id_card: userInfoStore.id_card || '',
			marital_status: userInfoStore.marital_status || 'single',
			ethnicity: userInfoStore.ethnicity || '',
			birth_date: userInfoStore.birth_date || ''
		}
	} catch (error) {
		console.error('获取用户信息失败:', error)
	} finally {
		uni.hideLoading()
	}
})

// 选择头像
const onChooseAvatar = (e) => {
	formData.value.avatarUrl = e.detail.avatarUrl
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

// 验证手机号
const validatePhone = () => {
	if (formData.value.phone && !/^1[3-9]\d{9}$/.test(formData.value.phone)) {
		uni.showToast({
			title: '请输入正确的手机号',
			icon: 'none'
		})
	}
}

// 验证身份证号
const validateIdCard = () => {
	if (formData.value.id_card && !/^\d{17}[\dXx]$/.test(formData.value.id_card)) {
		uni.showToast({
			title: '请输入正确的身份证号',
			icon: 'none'
		})
	}
}

// 验证出生日期格式
const validateBirthDate = () => {
	if (formData.value.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.value.birth_date)) {
		uni.showToast({
			title: '请输入正确的出生日期格式：YYYY-MM-DD',
			icon: 'none'
		})
	}
}
</script>

<style lang="scss" scoped>
.personal-info-container {
	min-height: 100vh;
	/* 修改后的蓝色渐变椭圆背景 */
	background: radial-gradient(ellipse 100% 60% at 50% 0%, // 椭圆形状（宽度100%，高度60%）
			#4B7BF9 0%, // 起始颜色（深蓝色）
			#A1C4FD 70%, // 过渡颜色（浅蓝色）
			transparent 100% // 透明过渡
		),
		linear-gradient(#FFFFFF, #FFFFFF); // 白色底层保证下方区域纯白
	background-repeat: no-repeat;
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;

	.left,
	.right {
		width: 60rpx;
	}

	.title {
		font-size: 36rpx;
		font-weight: 500;
		color: #FFFFFF;
	}
}

.avatar-section {
	display: flex;
	justify-content: center;
	padding: 40rpx 0;

	.avatar-wrapper {
		padding: 0;
		width: 160rpx;
		height: 160rpx;
		border-radius: 80rpx;
		overflow: hidden;
		background: #FFFFFF;
	}

	.avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.form-section {
	margin: 0 32rpx;
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 32rpx;

	.address-input {
		width: 100%;
		height: 160rpx;
		padding: 20rpx;
		box-sizing: border-box;
		font-size: 28rpx;
		line-height: 1.5;
		background-color: #F8F8F8;
		border-radius: 8rpx;
	}

	.address-count {
		display: block;
		text-align: right;
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}
}

.submit-btn {
	margin: 60rpx 32rpx;

	.btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: #4A90E2;
		color: #FFFFFF;
		border-radius: 44rpx;
		font-size: 32rpx;
	}
}
</style>