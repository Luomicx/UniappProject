<template>
    <view class="community-container">
        <!-- 固定头部区域 -->
        <view class="fixed-header">
            <!-- 顶部状态栏占位 -->
            <u-status-bar></u-status-bar>

            <!-- 顶部搜索栏 -->
            <view class="search-header">
                <view class="search-box">
                    <u-icon name="search" size="32" color="#999999"></u-icon>
                    <input type="text" v-model="searchQuery" placeholder="搜索帖子" @confirm="handleSearch" />
                </view>
            </view>

            <!-- 分类标签 -->
            <scroll-view scroll-x class="category-scroll" show-scrollbar="false">
                <view class="category-list">
                    <view v-for="(category, index) in categories" :key="index" class="category-item"
                        :class="{ active: currentCategory === category.value }" @click="selectCategory(category.value)">
                        {{ category.label }}
                    </view>
                </view>
            </scroll-view>
        </view>

        <!-- 主内容区域 -->
        <view class="main-content">
            <!-- 帖子列表 -->
            <scroll-view scroll-y class="post-list" refresher-enabled @refresherrefresh="handleRefresh"
                @scrolltolower="handleLoadMore" :refresher-triggered="isRefreshing">
                <view v-if="posts.length === 0 && !isLoading" class="empty-state">
                    <u-empty mode="data" icon="http://cdn.uviewui.com/uview/empty/data.png"></u-empty>
                </view>
                <view v-else>
                    <view v-for="(post, index) in posts" :key="post.id" class="post-item"
                        :style="{ 'animation-delay': `${index * 0.05}s` }" @click="navigateToDetail(post.id)">
                        <view class="post-header">
                            <view class="user-info">
                                <image class="avatar" :src="post.author.avatar" mode="aspectFill"></image>
                                <view class="user-meta">
                                    <text class="username">{{ post.author.name }}</text>
                                    <text class="post-time">{{ formatTime(post.created_at) }}</text>
                                </view>
                            </view>
                            <view class="category-tag" :class="post.category">
                                {{ getCategoryText(post.category) }}
                            </view>
                        </view>
                        <view class="post-content">
                            <text class="post-title">{{ post.title }}</text>
                            <text class="post-description">{{ post.description }}</text>
                            <image :src="handleImageDisplay(post.image)" mode="aspectFill" class="post-image"
                                :class="{ loaded: post.imageLoaded }" @load="handleImageLoad(post)" lazy-load></image>
                        </view>
                        <view class="post-footer">
                            <view class="action-item" @click.stop="handleLike(post)">
                                <u-icon :name="post.is_liked ? 'heart-fill' : 'heart'" class="like-icon"
                                    :class="{ liked: post.is_liked }" size="28"
                                    :color="post.is_liked ? '#FF6B6B' : '#999999'"></u-icon>
                                <text :class="{ 'liked': post.is_liked }">{{ post.likes_count || post.like_count || 0
                                }}</text>
                            </view>
                            <view class="action-item">
                                <u-icon name="chat" size="28" color="#999999"></u-icon>
                                <text>{{ post.comments_count || 0 }}</text>
                            </view>
                        </view>
                    </view>
                    <view v-if="hasMore" class="loading-more">
                        <u-loading-icon></u-loading-icon>
                        <text>加载中...</text>
                    </view>
                    <view v-else class="no-more">
                        <text>没有更多了</text>
                    </view>
                </view>
            </scroll-view>
        </view>

        <!-- 底部导航栏占位 -->
        <view class="tab-bar-placeholder"></view>

        <!-- 底部导航栏 -->
        <custom-tab-bar></custom-tab-bar>

        <!-- 悬浮发布按钮 -->
        <view class="floating-post-btn" @click="navigateToPost">
            <u-icon name="plus" size="28" color="#FFFFFF"></u-icon>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getPostList, likePost, unlikePost } from '@/api/post'
import CustomTabBar from '@/components/custom-tab-bar.vue'
import { useTabBarStore } from '@/store/tabBar'
import { usePostStore } from '@/store/postStore'

const store = useTabBarStore()
const postStore = usePostStore()

// 状态变量
const searchQuery = ref('')
const currentCategory = ref('all')
const posts = ref([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const isLoading = ref(false)
const isRefreshing = ref(false)
const lastUpdateTime = ref(Date.now())

// 监听全局状态变化，更新帖子列表
watch(() => postStore.lastUpdatedPostId, (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
        // 找到对应的帖子并更新
        const postIndex = posts.value.findIndex(p => p.id === newVal)
        if (postIndex !== -1) {
            const storedState = postStore.getPostState(newVal)
            const updatedPost = { ...posts.value[postIndex] }

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
            posts.value[postIndex] = updatedPost

            // 触发视图更新
            nextTick(() => {
                posts.value = [...posts.value]
            })
        }
    }
})

// 获取帖子列表
const fetchPosts = async (refresh = false) => {
    if (isLoading.value) return

    try {
        isLoading.value = true
        if (refresh) {
            page.value = 1
            hasMore.value = true
        }

        const params = {
            page: page.value,
            page_size: pageSize.value,
            category: currentCategory.value === 'all' ? '' : currentCategory.value,
            search: searchQuery.value
        }

        const response = await getPostList(params)

        // 检查响应格式
        if (!response || !response.data) {
            throw new Error('获取帖子列表失败：无效的响应格式')
        }

        const newPosts = response.data.posts || []

        // 处理帖子数据
        const processedPosts = newPosts.map(post => {
            // 处理字段名称差异
            return {
                ...post,
                // 将like_count映射为likes_count以保持一致性
                likes_count: post.like_count || 0,
                // 如果没有comments_count字段，默认为0
                comments_count: post.comments_count || 0,
                // 如果没有is_liked字段，默认为false
                is_liked: post.is_liked || false,
                // 处理图片
                image: handleImageDisplay(post.image)
            }
        })

        // 同步全局状态
        const syncedPosts = processedPosts.map(post => {
            const storedState = postStore.getPostState(post.id)
            if (storedState) {
                // 如果有存储的状态，则更新帖子的状态
                if (storedState.is_liked !== undefined) {
                    post.is_liked = storedState.is_liked
                }
                if (storedState.likes_count !== undefined) {
                    post.likes_count = storedState.likes_count
                }
                if (storedState.comments_count !== undefined) {
                    post.comments_count = storedState.comments_count
                }
            }
            return post
        })

        if (refresh) {
            posts.value = syncedPosts
        } else {
            posts.value = [...posts.value, ...syncedPosts]
        }

        hasMore.value = newPosts.length === pageSize.value
        page.value++
        lastUpdateTime.value = Date.now()
    } catch (error) {
        uni.showToast({
            title: error.message || '获取帖子列表失败',
            icon: 'none'
        })
    } finally {
        isLoading.value = false
        isRefreshing.value = false
    }
}

// 处理下拉刷新
const handleRefresh = () => {
    isRefreshing.value = true
    fetchPosts(true)
}

// 处理加载更多
const handleLoadMore = () => {
    if (hasMore.value && !isLoading.value) {
        fetchPosts()
    }
}

// 处理搜索
const handleSearch = () => {
    fetchPosts(true)
}

// 选择分类
const selectCategory = (category) => {
    currentCategory.value = category
    fetchPosts(true)
}

// 跳转到发帖页面
const navigateToPost = () => {
    uni.navigateTo({
        url: '/pages/patient/post-create'
    })
}

// 跳转到帖子详情
const navigateToDetail = (id) => {
    uni.navigateTo({
        url: `/pages/patient/post-detail?id=${id}`
    })
}

// 处理点赞
const handleLike = async (post) => {
    try {
        if (post.is_liked) {
            const response = await unlikePost(post.id)
            if (response.code === 200) {
                post.is_liked = false
                post.likes_count = Math.max(0, post.likes_count - 1)
                // 更新全局状态
                postStore.updateLikeStatus(post.id, false, post.likes_count)
            }
        } else {
            const response = await likePost(post.id)
            if (response.code === 200) {
                post.is_liked = true
                post.likes_count = (post.likes_count || 0) + 1
                // 更新全局状态
                postStore.updateLikeStatus(post.id, true, post.likes_count)
            }
        }
    } catch (error) {
        uni.showToast({
            title: error.message || '操作失败',
            icon: 'none'
        })
    }
}

// 自动刷新定时器
let refreshTimer = null

// 自动刷新函数
const startAutoRefresh = () => {
    // 每3分钟自动刷新一次，减少频繁请求
    refreshTimer = setInterval(() => {
        // 只有当页面停留超过3分钟时才自动刷新
        if (Date.now() - lastUpdateTime.value > 180000) {
            fetchPosts(true)
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

// 在图片加载处理中添加状态管理
const handleImageLoad = (post) => {
    post.imageLoaded = true
    nextTick(() => {
        // 触发视图更新
        posts.value = [...posts.value]
    })
}

// 添加分类数据
const categories = [
    { label: '全部', value: 'all' },
    { label: '经验分享', value: 'experience' },
    { label: '问题咨询', value: 'question' },
    { label: '医疗资讯', value: 'news' }
]

// 页面加载时获取帖子列表
onMounted(() => {
    store.setCurrentPath('/pages/patient/community')
    fetchPosts(true)
    startAutoRefresh()
})

onUnmounted(() => {
    stopAutoRefresh()
})
</script>

<style lang="scss" scoped>
/* 添加硬件加速 */
.community-container {
    transform: translateZ(0);
    contain: strict;
    min-height: 100vh;
    background: #F5F6FA;
    display: flex;
    flex-direction: column;
    position: relative;
}

/* 固定头部区域 */
.fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: #FFFFFF;
}

/* 优化搜索栏 */
.search-header {
    background: #FFFFFF;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    padding: 20rpx 32rpx;

    .search-box {
        flex: 1;
        height: 72rpx;
        background: #F5F6FA;
        border-radius: 36rpx;
        padding: 0 24rpx;
        display: flex;
        align-items: center;
        gap: 12rpx;

        input {
            flex: 1;
            font-size: 28rpx;
            color: #333333;
        }
    }
}

/* 优化分类栏滚动 */
.category-scroll {
    background: #FFFFFF;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    will-change: transform;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

    .category-list {
        display: flex;
        flex-wrap: nowrap;
        padding: 20rpx 32rpx;

        .category-item {
            flex-shrink: 0;
            padding: 12rpx 32rpx;
            border-radius: 32rpx;
            font-size: 28rpx;
            color: #666666;
            background: #F5F6FA;
            transition: all 0.3s ease;
            margin-right: 20rpx;

            &:active {
                transform: scale(0.95);
            }

            &.active {
                color: #FFFFFF;
                background: #4A90E2;
            }
        }
    }
}

/* 主内容区域 */
.main-content {
    flex: 1;
    margin-top: calc(var(--status-bar-height) + 180rpx);
    margin-bottom: 100rpx;
    position: relative;
}

/* 优化帖子列表 */
.post-list {
    height: calc(100vh - var(--status-bar-height) - 280rpx);
    padding: 20rpx 32rpx;
    box-sizing: border-box;
    will-change: transform;
    backface-visibility: hidden;
    perspective: 1000;
}

/* 列表项入场动画 */
.post-item {
    animation: itemEnter 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
    opacity: 0;
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 16rpx;
    margin-bottom: 16rpx;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

    .post-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;

        .user-info {
            display: flex;
            align-items: center;
            gap: 8rpx;

            .avatar {
                width: 64rpx;
                height: 64rpx;
                border-radius: 32rpx;
                border: 1px solid #EEEEEE;
            }

            .user-meta {
                display: flex;
                flex-direction: column;
                justify-content: center;
                margin-left: 8rpx;

                .username {
                    font-size: 26rpx;
                    color: #333333;
                    font-weight: 500;
                }

                .post-time {
                    font-size: 22rpx;
                    color: #999999;
                    margin-top: 2rpx;
                }
            }
        }

        .category-tag {
            padding: 4rpx 12rpx;
            border-radius: 6rpx;
            font-size: 22rpx;

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

    .post-content {
        .post-title {
            font-size: 28rpx;
            color: #333333;
            font-weight: 500;
            margin-bottom: 4rpx;
            display: block;
            line-height: 1.4;
        }

        .post-description {
            font-size: 26rpx;
            color: #666666;
            line-height: 1.4;
            margin-bottom: 8rpx;
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .post-image {
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            background: linear-gradient(135deg, #f5f6fa 25%, #e1e4ed 50%, #f5f6fa 75%);
            background-size: 400% 400%;
            animation: loadingBg 1.5s ease infinite;
            width: 100%;
            height: 280rpx;
            border-radius: 8rpx;
            margin-bottom: 8rpx;
            object-fit: cover;

            &.loaded {
                opacity: 1;
                animation: none;
                background: none;
            }

            &:active {
                transform: scale(0.98);
            }
        }
    }

    .post-footer {
        display: flex;
        align-items: center;
        gap: 24rpx;
        padding-top: 8rpx;
        border-top: 1px solid rgba(0, 0, 0, 0.05);

        .action-item {
            display: flex;
            align-items: center;
            gap: 4rpx;
            padding: 4rpx 12rpx;
            border-radius: 20rpx;
            background: rgba(0, 0, 0, 0.02);
            transition: all 0.3s ease;

            &:active {
                background: rgba(0, 0, 0, 0.05);
            }

            text {
                font-size: 24rpx;
                color: #999999;
                transition: color 0.3s;
                margin-left: 4rpx;

                &.liked {
                    color: #FF6B6B;
                }
            }

            .like-icon {
                transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);

                &.liked {
                    animation: likeScale 0.45s ease;
                }
            }
        }
    }

    &:active {
        transform: scale(0.995);
    }
}

@keyframes itemEnter {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes loadingBg {
    0% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0 50%;
    }
}

@keyframes likeScale {
    0% {
        transform: scale(1);
    }

    30% {
        transform: scale(1.4);
    }

    50% {
        transform: scale(0.9);
    }

    70% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}

/* 悬浮按钮动画 */
.floating-post-btn {
    position: fixed;
    right: 32rpx;
    bottom: 200rpx;
    width: 96rpx;
    height: 96rpx;
    background: #4A90E2;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.3);
    z-index: 100;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
        transform: scale(0.9) rotate(135deg);
        box-shadow: 0 8rpx 24rpx rgba(74, 144, 226, 0.4);
    }

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        animation: ripple 1.2s infinite;
    }
}

@keyframes ripple {
    from {
        transform: scale(1);
        opacity: 1;
    }

    to {
        transform: scale(2);
        opacity: 0;
    }
}

.loading-more,
.no-more {
    text-align: center;
    padding: 20rpx 0;

    text {
        font-size: 24rpx;
        color: #999999;
        margin-left: 8rpx;
    }
}

.empty-state {
    padding: 120rpx 0;
}

/* 固定底部导航栏 */
.tab-bar-placeholder {
    height: 100rpx;
    width: 100%;
}
</style>