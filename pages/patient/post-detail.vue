<template>
	<view class="post-detail-container">
		<!-- 顶部状态栏占位 -->
		<u-status-bar></u-status-bar>

		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="left" @click="handleBack">
				<u-icon name="arrow-left" color="#333333" size="20"></u-icon>
			</view>
			<text class="title">帖子详情</text>
			<view class="right">
				<u-icon v-if="isAuthor" name="trash" color="#FF6B6B" size="20" @click="handleDelete"></u-icon>
			</view>
		</view>

		<!-- 帖子内容 -->
		<scroll-view scroll-y class="content-scroll" refresher-enabled @refresherrefresh="handleRefresh"
			:refresher-triggered="isRefreshing">
			<view class="post-content">
				<!-- 作者信息 -->
				<view class="author-info">
					<image class="avatar" :src="post.author?.avatar" mode="aspectFill"></image>
					<view class="meta">
						<text class="name">{{ post.author?.name }}</text>
						<text class="time">{{ formatTime(post.created_at) }}</text>
					</view>
					<view class="category-tag" :class="post.category">
						{{ getCategoryText(post.category) }}
					</view>
				</view>

				<!-- 帖子标题和内容 -->
				<view class="main-content">
					<text class="title">{{ post.title }}</text>
					<text class="description">{{ post.description }}</text>
					<image v-if="post.image" class="content-image" :src="post.image" mode="widthFix"
						@click="previewImage"></image>
				</view>

				<!-- 互动数据 -->
				<view class="interaction-bar">
					<view class="action-item" @click="handleLike">
						<u-icon :name="post.is_liked ? 'heart-fill' : 'heart'" size="32"
							:color="post.is_liked ? '#FF6B6B' : '#999999'"></u-icon>
						<text>{{ post.likes_count || post.like_count || 0 }}</text>
					</view>
					<view class="action-item">
						<u-icon name="chat" size="32" color="#999999"></u-icon>
						<text>{{ post.comments_count || 0 }}</text>
					</view>
				</view>
			</view>

			<!-- 评论列表 -->
			<view class="comments-section">
				<view class="section-title">
					<text>全部评论</text>
					<text class="count">({{ post.comments_count || 0 }})</text>
				</view>

				<view v-if="comments.length === 0" class="empty-comments">
					<u-empty mode="comment" icon="http://cdn.uviewui.com/uview/empty/comment.png"></u-empty>
				</view>

				<view v-else class="comment-list">
					<view class="comment-item" v-for="comment in comments" :key="comment.id">
						<view class="comment-content">
							<view class="comment-header">
								<text class="name">{{ comment.author?.name || comment.user?.phone_number || '用户'
								}}</text>
								<text class="time">{{ formatTime(comment.created_at) }}</text>
							</view>
							<text class="text">{{ comment.content }}</text>
							<view class="comment-footer">
								<view class="action-item" @click="handleCommentLike(comment)">
									<u-icon :name="comment.is_liked ? 'heart-fill' : 'heart'" size="24"
										:color="comment.is_liked ? '#FF6B6B' : '#999999'"></u-icon>
									<text>{{ comment.likes_count || comment.like_count || 0 }}</text>
								</view>
								<view class="action-item" v-if="(comment.author?.id || comment.user?.id) === userId"
									@click="deleteComment(comment.id)">
									<u-icon name="trash" size="24" color="#999999"></u-icon>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- 优化后的加载状态 -->
				<view v-if="isLoading" class="loading-state">
					<u-loading-icon :animation="true" mode="circle" color="#4A90E2" size="36"></u-loading-icon>
					<text class="loading-text">加载中...</text>
				</view>
			</view>
		</scroll-view>

		<!-- 评论输入框 -->
		<view class="comment-input" :class="{ keyboardUp: commentInputHeight > 0 }">
			<input type="text" v-model="commentText" placeholder="写下你的评论..." :focus="isInputFocused"
				@focus="isInputFocused = true" @blur="isInputFocused = false" />
			<view class="send-btn" :class="{ active: commentText.trim() }" @click="submitComment">
				发送
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch, nextTick } from 'vue'
import {
	getPostDetail,
	getPostComments,
	commentPost,
	deleteComment as deleteCommentApi,
	likePost,
	unlikePost,
	deletePost
} from '@/api/post'
import { usePostStore } from '@/store/postStore'

const props = defineProps({
	id: {
		type: String,
		required: true
	}
})

// 初始化全局状态
const postStore = usePostStore()

// 状态变量
const post = ref({})
const comments = ref([])
const commentText = ref('')
const isInputFocused = ref(false)
const isRefreshing = ref(false)
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const userId = ref(uni.getStorageSync('userId'))
const lastUpdateTime = ref(Date.now())
const isLoading = ref(false)
const commentInputHeight = ref(0)

// 监听全局状态变化
watch(() => postStore.lastUpdatedPostId, (newVal, oldVal) => {
	if (newVal && newVal !== oldVal && newVal === props.id) {
		// 如果更新的是当前帖子，同步状态
		const storedState = postStore.getPostState(props.id)
		if (storedState) {
			const updatedPost = { ...post.value }

			// 更新点赞状态
			if (storedState.is_liked !== undefined) {
				updatedPost.is_liked = storedState.is_liked
			}

			// 更新点赞数
			if (storedState.likes_count !== undefined) {
				updatedPost.likes_count = storedState.likes_count
			}

			// 更新评论数
			if (storedState.comments_count !== undefined) {
				updatedPost.comments_count = storedState.comments_count
			}

			// 更新帖子
			post.value = updatedPost
		}
	}
})

// 计算属性
const isAuthor = computed(() => {
	return post.value.author?.id === userId.value
})

// 处理图片显示
const handleImageDisplay = (imageData) => {
	if (!imageData) return ''
	// 如果已经是base64格式，直接返回
	if (imageData.startsWith('data:image')) {
		return imageData
	}
	// 如果是二进制数据，转换为base64
	try {
		return 'data:image/jpeg;base64,' + imageData
	} catch (error) {
		return ''
	}
}

// 获取帖子详情
const fetchPostDetail = async () => {
	try {
		const response = await getPostDetail(props.id)
		if (response && response.data) {
			// 处理帖子数据，适配字段名称差异
			post.value = {
				...response.data,
				// 将like_count映射为likes_count以保持一致性
				likes_count: response.data.like_count || 0,
				// 如果没有comments_count字段，默认为0
				comments_count: response.data.comments_count || 0,
				// 如果没有is_liked字段，默认为false
				is_liked: response.data.is_liked || false,
				// 处理图片
				image: handleImageDisplay(response.data.image)
			}

			// 检查全局状态中是否有该帖子的状态
			const storedState = postStore.getPostState(props.id)
			if (storedState) {
				// 如果有存储的状态，则更新帖子的状态
				if (storedState.is_liked !== undefined) {
					post.value.is_liked = storedState.is_liked
				}

				if (storedState.likes_count !== undefined) {
					post.value.likes_count = storedState.likes_count
				}

				if (storedState.comments_count !== undefined) {
					post.value.comments_count = storedState.comments_count
				}
			}

			// 从帖子详情中提取评论数据
			if (response.data.comments) {
				// 处理评论数据，适配字段名称差异
				comments.value = response.data.comments.map(comment => ({
					...comment,
					// 将like_count映射为likes_count以保持一致性
					likes_count: comment.like_count || 0,
					// 如果没有is_liked字段，默认为false
					is_liked: comment.is_liked || false,
					// 确保author字段存在
					author: comment.author || { id: 0, name: '未知用户', avatar: '' }
				}));

				// 更新帖子的评论数
				post.value.comments_count = comments.value.length;
				// 更新全局状态
				postStore.updateCommentsCount(props.id, post.value.comments_count);
			}

			lastUpdateTime.value = Date.now()
		}
	} catch (error) {
		uni.showToast({
			title: error.message || '获取帖子详情失败',
			icon: 'none'
		})
	} finally {
		isRefreshing.value = false
	}
}

// 获取评论列表
const fetchComments = async (refresh = false) => {
	if (!hasMore.value || isLoading.value) return

	try {
		isLoading.value = true
		const response = await getPostComments(props.id, page.value)

		if (response && response.data) {
			const newComments = response.data.map(comment => ({
				...comment,
				likes_count: comment.like_count || 0,
				is_liked: comment.is_liked || false,
				author: comment.author || { id: 0, name: '未知用户', avatar: '' }
			}))

			if (refresh) {
				comments.value = newComments
			} else {
				comments.value = [...comments.value, ...newComments]
			}

			page.value++
			hasMore.value = newComments.length >= pageSize.value
		}
	} catch (error) {
		console.error('获取评论失败:', error)
		uni.showToast({
			title: '获取评论失败',
			icon: 'none'
		})
	} finally {
		isLoading.value = false
		isRefreshing.value = false
	}
}

// 提交评论
const submitComment = async () => {
	const content = commentText.value.trim()
	if (!content) return

	try {
		const response = await commentPost(props.id, { content })
		console.log('评论提交响应:', response)

		if (response && (response.code === 200 || response.status === 200)) {
			commentText.value = ''
			// 刷新帖子详情，获取最新评论
			await fetchPostDetail()

			uni.showToast({
				title: '评论成功',
				icon: 'success'
			})
		} else {
			throw new Error(response.message || '评论失败')
		}
	} catch (error) {
		console.error('评论提交错误:', error)
		uni.showToast({
			title: error.message || '评论失败',
			icon: 'none'
		})
	}
}

// 自动刷新函数
const startAutoRefresh = () => {
	// 每3分钟自动刷新一次，减少频繁请求
	refreshTimer = setInterval(() => {
		// 只有当页面停留超过3分钟时才自动刷新
		if (Date.now() - lastUpdateTime.value > 180000) {
			fetchPostDetail()
		}
	}, 180000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
	if (refreshTimer) {
		clearInterval(refreshTimer)
		refreshTimer = null
	}
}

// 删除评论
const deleteComment = async (commentId) => {
	try {
		const result = await uni.showModal({
			title: '提示',
			content: '确定要删除这条评论吗？',
			confirmColor: '#FF6B6B'
		});

		if (result.confirm) {
			console.log('删除评论ID:', commentId);
			const response = await deleteCommentApi(props.id, commentId);
			console.log('删除评论响应:', response);

			if (response && (response.code === 200 || response.status === 200)) {
				// 刷新帖子详情，获取最新评论
				await fetchPostDetail();

				uni.showToast({
					title: '删除成功',
					icon: 'success'
				});
			} else {
				throw new Error(response.message || '删除失败');
			}
		}
	} catch (error) {
		console.error('删除评论错误:', error);
		if (error.errMsg !== 'showModal:fail cancel') {
			uni.showToast({
				title: error.message || '删除失败',
				icon: 'none'
			});
		}
	}
}

// 处理点赞
const handleLike = async () => {
	try {
		if (post.value.is_liked) {
			await unlikePost(props.id)
			post.value.is_liked = false
			post.value.likes_count = Math.max(0, post.value.likes_count - 1)
			// 更新全局状态
			postStore.updateLikeStatus(props.id, false, post.value.likes_count)
		} else {
			await likePost(props.id)
			post.value.is_liked = true
			post.value.likes_count = (post.value.likes_count || 0) + 1
			// 更新全局状态
			postStore.updateLikeStatus(props.id, true, post.value.likes_count)
		}
	} catch (error) {
		uni.showToast({
			title: '操作失败',
			icon: 'none'
		})
	}
}

// 处理评论点赞
const handleCommentLike = async (comment) => {
	try {
		console.log('点赞评论:', comment);
		let response;

		if (comment.is_liked) {
			// 取消点赞
			response = await unlikePost(comment.id);
			console.log('取消点赞响应:', response);

			if (response && (response.code === 200 || response.status === 200)) {
				comment.is_liked = false;
				comment.likes_count = Math.max(0, (comment.likes_count || 0) - 1);
			} else {
				throw new Error(response.message || '操作失败');
			}
		} else {
			// 点赞
			response = await likePost(comment.id);
			console.log('点赞响应:', response);

			if (response && (response.code === 200 || response.status === 200)) {
				comment.is_liked = true;
				comment.likes_count = (comment.likes_count || 0) + 1;
			} else {
				throw new Error(response.message || '操作失败');
			}
		}

		// 触发视图更新
		nextTick(() => {
			comments.value = [...comments.value];
		});
	} catch (error) {
		console.error('评论点赞错误:', error);
		uni.showToast({
			title: error.message || '操作失败',
			icon: 'none'
		});
	}
}

// 删除帖子
const handleDelete = async () => {
	try {
		await uni.showModal({
			title: '提示',
			content: '确定要删除这篇帖子吗？',
			confirmColor: '#FF6B6B'
		})

		await deletePost(props.id)

		uni.showToast({
			title: '删除成功',
			icon: 'success'
		})

		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
	} catch (error) {
		if (error.errMsg !== 'showModal:fail cancel') {
			uni.showToast({
				title: '删除失败',
				icon: 'none'
			})
		}
	}
}

// 预览图片
const previewImage = () => {
	if (post.value.image) {
		uni.previewImage({
			urls: [post.value.image]
		})
	}
}

// 返回上一页
const handleBack = () => {
	uni.navigateBack()
}

// 处理下拉刷新
const handleRefresh = () => {
	isRefreshing.value = true
	fetchPostDetail()
}

// 格式化时间
const formatTime = (timestamp) => {
	const date = new Date(timestamp)
	const now = new Date()
	const diff = now - date

	// 小于1分钟
	if (diff < 60000) {
		return '刚刚'
	}
	// 小于1小时
	if (diff < 3600000) {
		return Math.floor(diff / 60000) + '分钟前'
	}
	// 小于24小时
	if (diff < 86400000) {
		return Math.floor(diff / 3600000) + '小时前'
	}
	// 小于30天
	if (diff < 2592000000) {
		return Math.floor(diff / 86400000) + '天前'
	}
	// 其他情况显示具体日期
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取分类文本
const getCategoryText = (category) => {
	const categoryMap = {
		'experience': '经验分享',
		'question': '问题咨询',
		'news': '医疗资讯'
	}
	return categoryMap[category] || '其他'
}

// 页面加载时获取数据
onMounted(() => {
	fetchPostDetail()
	startAutoRefresh()
	uni.onKeyboardHeightChange(res => {
		commentInputHeight.value = res.height > 0 ? res.height + 100 : 0
		const commentInput = document.querySelector('.comment-input')
		if (commentInput) {
			commentInput.style.transform = `translateY(-${commentInputHeight.value}px)`
		}
	})
})

onUnmounted(() => {
	stopAutoRefresh()
	uni.offKeyboardHeightChange()
})
</script>

<style lang="scss" scoped>
.post-detail-container {
	min-height: 100vh;
	background: #F5F6FA;
	display: flex;
	flex-direction: column;
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

.content-scroll {
	flex: 1;
	height: 0;
}

.post-content {
	background: #FFFFFF;
	padding: 32rpx;
	margin-bottom: 20rpx;

	.author-info {
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;

		.avatar {
			width: 80rpx;
			height: 80rpx;
			border-radius: 40rpx;
			margin-right: 16rpx;
		}

		.meta {
			flex: 1;
			display: flex;
			flex-direction: column;

			.name {
				font-size: 28rpx;
				color: #333333;
				font-weight: 500;
			}

			.time {
				font-size: 24rpx;
				color: #999999;
				margin-top: 4rpx;
			}
		}

		.category-tag {
			padding: 8rpx 16rpx;
			border-radius: 8rpx;
			font-size: 24rpx;

			&.experience {
				color: #4A90E2;
				background: rgba(74, 144, 226, 0.1);
			}

			&.question {
				color: #FF6B6B;
				background: rgba(255, 107, 107, 0.1);
			}

			&.news {
				color: #50C881;
				background: rgba(80, 200, 129, 0.1);
			}
		}
	}

	.main-content {
		.title {
			font-size: 36rpx;
			color: #333333;
			font-weight: 600;
			margin-bottom: 16rpx;
			display: block;
		}

		.description {
			font-size: 28rpx;
			color: #666666;
			line-height: 1.6;
			margin-bottom: 24rpx;
			display: block;
		}

		.content-image {
			width: 100%;
			border-radius: 8rpx;
			margin-bottom: 24rpx;
		}
	}

	.interaction-bar {
		display: flex;
		gap: 32rpx;

		.action-item {
			display: flex;
			align-items: center;
			gap: 8rpx;

			text {
				font-size: 24rpx;
				color: #999999;
			}
		}
	}
}

.comments-section {
	background: #FFFFFF;
	padding: 32rpx;

	.section-title {
		margin-bottom: 24rpx;
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;

		.count {
			font-size: 28rpx;
			color: #999999;
			font-weight: 400;
			margin-left: 8rpx;
		}
	}

	.comment-list {
		.comment-item {
			padding: 24rpx 0;
			border-bottom: 1rpx solid #f5f5f5;

			.comment-content {
				.comment-header {
					margin-bottom: 12rpx;
					display: flex;
					align-items: center;
					gap: 16rpx;

					.name {
						font-size: 28rpx;
						color: #4A90E2;
						font-weight: 500;
					}

					.time {
						font-size: 24rpx;
						color: #999;
					}
				}

				.text {
					font-size: 28rpx;
					line-height: 1.5;
					color: #333;
					animation: textAppear 0.3s ease;
				}

				.comment-footer {
					margin-top: 16rpx;
					display: flex;
					align-items: center;
					gap: 24rpx;

					.action-item {
						display: flex;
						align-items: center;
						gap: 8rpx;
						padding: 8rpx;
						border-radius: 8rpx;
						transition: background-color 0.3s ease;

						&:active {
							background-color: rgba(0, 0, 0, 0.05);
						}

						text {
							font-size: 24rpx;
							color: #999;
						}
					}
				}
			}
		}
	}
}

.empty-comments {
	padding: 60rpx 0;
}

.loading-state {
	padding: 32rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	.loading-text {
		margin-top: 16rpx;
		font-size: 26rpx;
		color: #999;
		animation: pulse 1.5s infinite;
	}
}

.comment-input {
	position: sticky;
	bottom: 0;
	background: white;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
	transition: transform 0.3s ease;
	padding: 16rpx 24rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;

	&.keyboardUp {
		transform: translateY(-400rpx);
	}

	input {
		flex: 1;
		height: 72rpx;
		background: #F5F6FA;
		border-radius: 36rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
	}

	.send-btn {
		padding: 12rpx 24rpx;
		border-radius: 32rpx;
		background: #E0E0E0;
		color: #FFFFFF;
		font-size: 28rpx;
		transition: all 0.3s ease;

		&.active {
			background: #4A90E2;
		}
	}
}

@keyframes textAppear {
	from {
		opacity: 0;
		transform: translateX(10px);
	}

	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@keyframes pulse {
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