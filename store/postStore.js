import { defineStore } from 'pinia'

export const usePostStore = defineStore('post', {
    state: () => ({
        // 存储帖子的点赞状态和评论数
        postStates: {},
        // 最后更新的帖子ID
        lastUpdatedPostId: null
    }),

    actions: {
        // 更新帖子的点赞状态
        updateLikeStatus(postId, isLiked, likesCount) {
            if (!this.postStates[postId]) {
                this.postStates[postId] = {}
            }

            this.postStates[postId].is_liked = isLiked
            this.postStates[postId].likes_count = likesCount
            this.lastUpdatedPostId = postId
        },

        // 更新帖子的评论数
        updateCommentsCount(postId, commentsCount) {
            if (!this.postStates[postId]) {
                this.postStates[postId] = {}
            }

            this.postStates[postId].comments_count = commentsCount
            this.lastUpdatedPostId = postId
        },

        // 获取帖子的状态
        getPostState(postId) {
            return this.postStates[postId] || {}
        },

        // 同步帖子列表中的状态
        syncPostsState(posts) {
            const updatedPosts = [...posts]

            for (let i = 0; i < updatedPosts.length; i++) {
                const post = updatedPosts[i]
                const storedState = this.postStates[post.id]

                if (storedState) {
                    // 如果存在存储的状态，则更新帖子的状态
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
            }

            return updatedPosts
        },

        // 重置状态
        resetState() {
            this.postStates = {}
            this.lastUpdatedPostId = null
        }
    }
})