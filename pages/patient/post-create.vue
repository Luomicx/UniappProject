<template>
	<view class="post-create-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">发布帖子</text>
			<view class="right"></view>
		</view>

		<!-- 表单内容 -->
		<view class="form-content">
			<!-- 标题输入 -->
			<view class="input-group">
				<input type="text" v-model="formData.title" placeholder="请输入标题" class="title-input" maxlength="50" />
				<text class="count">{{ formData.title.length }}/50</text>
			</view>

			<!-- 分类选择 -->
			<view class="category-select">
				<text class="label">选择分类</text>
				<view class="category-list">
					<view class="category-item" :class="{ active: formData.category === 'experience' }"
						@click="selectCategory('experience')">
						经验分享
					</view>
					<view class="category-item" :class="{ active: formData.category === 'question' }"
						@click="selectCategory('question')">
						问题咨询
					</view>
					<view class="category-item" :class="{ active: formData.category === 'news' }"
						@click="selectCategory('news')">
						医疗资讯
					</view>
				</view>
			</view>

			<!-- 内容输入 -->
			<view class="input-group">
				<textarea v-model="formData.description" placeholder="请输入帖子内容" class="content-input"
					maxlength="1000"></textarea>
				<text class="count">{{ formData.description.length }}/1000</text>
			</view>

			<!-- 图片上传 -->
			<view class="upload-section">
				<view class="upload-box" @click="handleImageUpload" v-if="!formData.image">
					<u-icon name="camera-fill" size="40" color="#999999"></u-icon>
					<text>添加图片</text>
				</view>
				<view class="image-preview" v-else>
					<image :src="formData.image" mode="aspectFill"></image>
					<view class="delete-btn" @click.stop="deleteImage">
						<u-icon name="close" color="#FFFFFF" size="20"></u-icon>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部发布按钮 -->
		<view class="bottom-button">
			<button class="publish-btn" :class="{ disabled: isDisabled }" :disabled="isDisabled" @click="handleSubmit">
				发布
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { createPost, uploadImage } from '@/api/post'
import { usePostStore } from '@/store/postStore'

// 初始化全局状态
const postStore = usePostStore()

const formData = ref({
	title: '',
	category: '',
	description: '',
	image: '',
	imageBase64: ''
})

// 计算按钮是否禁用
const isDisabled = computed(() => {
	return !formData.value.title.trim() ||
		!formData.value.category ||
		!formData.value.description.trim()
})

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

// 选择分类
const selectCategory = (category) => {
	formData.value.category = category
}

// 处理图片上传
const handleImageUpload = async () => {
	try {
		const res = await uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			sourceType: ['album', 'camera']
		})

		if (res.tempFilePaths && res.tempFilePaths.length > 0) {
			formData.value.image = res.tempFilePaths[0]
			// 将图片转换为base64
			const base64 = await getBase64FromPath(formData.value.image)
			formData.value.imageBase64 = base64
		}
	} catch (error) {
		console.error('选择图片失败:', error)
		uni.showToast({
			title: '选择图片失败',
			icon: 'none'
		})
	}
}

// 将本地图片路径转换为base64
const getBase64FromPath = (path) => {
	return new Promise((resolve, reject) => {
		uni.getFileSystemManager().readFile({
			filePath: path,
			encoding: 'base64',
			success: (res) => {
				resolve('data:image/jpeg;base64,' + res.data)
			},
			fail: (error) => {
				reject(error)
			}
		})
	})
}

// 删除图片
const deleteImage = () => {
	formData.value.image = ''
	formData.value.imageBase64 = ''
}

// 提交帖子
const handleSubmit = async () => {
	try {
		if (!formData.value.title.trim()) {
			uni.showToast({
				title: '请输入标题',
				icon: 'none'
			})
			return
		}

		if (!formData.value.category) {
			uni.showToast({
				title: '请选择分类',
				icon: 'none'
			})
			return
		}

		if (!formData.value.description.trim()) {
			uni.showToast({
				title: '请输入描述',
				icon: 'none'
			})
			return
		}

		uni.showLoading({
			title: '发布中...',
			mask: true
		})

		// 构造请求数据
		const postData = {
			title: formData.value.title.trim(),
			category: formData.value.category,
			description: formData.value.description.trim()
		}

		// 如果有图片，使用uni.uploadFile上传
		if (formData.value.image) {
			// 使用uni.uploadFile上传文件和表单数据
			uni.uploadFile({
				url: 'http://39.106.58.59:8000/comment/posts/',
				filePath: formData.value.image,
				name: 'file',
				formData: {
					title: formData.value.title.trim(),
					category: formData.value.category,
					description: formData.value.description.trim()
				},
				header: {
					'Authorization': uni.getStorageSync('token_type') + ' ' + uni.getStorageSync('token')
				},
				success: (uploadRes) => {
					uni.hideLoading()

					// 解析响应数据
					let response
					try {
						response = JSON.parse(uploadRes.data)
					} catch (e) {
						response = uploadRes.data
					}

					if (response.code === 200) {
						// 触发全局状态更新，通知社区页面刷新
						postStore.lastUpdatedPostId = 'new-post'

						uni.showToast({
							title: '发布成功',
							icon: 'success'
						})

						// 返回上一页
						setTimeout(() => {
							uni.navigateBack()
						}, 1500)
					} else {
						uni.showToast({
							title: response.message || '发布失败',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					uni.hideLoading()
					uni.showToast({
						title: err.errMsg || '发布失败',
						icon: 'none'
					})
				}
			})
		} else {
			// 没有图片，直接使用API发送数据
			const response = await createPost(postData)

			uni.hideLoading()

			if (response.code === 200) {
				// 触发全局状态更新，通知社区页面刷新
				postStore.lastUpdatedPostId = 'new-post'

				uni.showToast({
					title: '发布成功',
					icon: 'success'
				})

				// 返回上一页
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} else {
				throw new Error(response.message || '发布失败')
			}
		}
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '发布失败',
			icon: 'none'
		})
	}
}
</script>

<style lang="scss" scoped>
.post-create-container {
	min-height: 100vh;
	background: #F5F6FA;
	padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
	position: relative;
}

.header {
	padding: 20rpx 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: #FFFFFF;

	.left,
	.right {
		width: 120rpx;
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

.form-content {
	padding: 32rpx;
}

.input-group {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
	position: relative;

	.title-input {
		font-size: 32rpx;
		color: #333333;
		width: 100%;
		padding-right: 80rpx;
	}

	.content-input {
		font-size: 28rpx;
		color: #333333;
		width: 100%;
		height: 400rpx;
		padding-bottom: 40rpx;
	}

	.count {
		position: absolute;
		right: 24rpx;
		bottom: 24rpx;
		font-size: 24rpx;
		color: #999999;
	}
}

.category-select {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;

	.label {
		font-size: 28rpx;
		color: #666666;
		margin-bottom: 16rpx;
		display: block;
	}

	.category-list {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;

		.category-item {
			padding: 12rpx 32rpx;
			border-radius: 32rpx;
			font-size: 28rpx;
			color: #666666;
			background: #F5F6FA;
			transition: all 0.3s;

			&.active {
				color: #FFFFFF;
				background: #4A90E2;
			}
		}
	}
}

.upload-section {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 24rpx;

	.upload-box {
		width: 200rpx;
		height: 200rpx;
		background: #F5F6FA;
		border-radius: 8rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8rpx;

		text {
			font-size: 24rpx;
			color: #999999;
		}
	}

	.image-preview {
		width: 200rpx;
		height: 200rpx;
		position: relative;

		image {
			width: 100%;
			height: 100%;
			border-radius: 8rpx;
		}

		.delete-btn {
			position: absolute;
			top: -20rpx;
			right: -20rpx;
			width: 40rpx;
			height: 40rpx;
			background: rgba(0, 0, 0, 0.5);
			border-radius: 20rpx;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
}

.bottom-button {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 24rpx 32rpx;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	background: #FFFFFF;
	box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
	z-index: 100;

	.publish-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: #4A90E2;
		color: #FFFFFF;
		font-size: 32rpx;
		font-weight: 500;
		border-radius: 44rpx;
		border: none;
		padding: 0;

		&.disabled {
			background: #CCCCCC;
			color: #FFFFFF;
		}

		&:active {
			opacity: 0.8;
		}
	}
}
</style>