import request from '@/utils/request'

// 获取帖子列表
export const getPostList = (params) => {
    return request({
        url: '/comment/posts',
        method: 'GET',
        data: params
    })
}

// 获取帖子详情
export const getPostDetail = (id) => {
    return request({
        url: `/comment/posts/${id}`,
        method: 'GET'
    })
}

// 创建帖子
export const createPost = (data) => {
    // 如果没有文件，使用普通的JSON请求
    if (!data.file) {
        return request({
            url: '/comment/posts/',
            method: 'POST',
            data: {
                title: data.title,
                category: data.category,
                description: data.description
            }
        })
    }

    // 如果有文件，使用FormData
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('category', data.category)
    formData.append('description', data.description)
    if (data.file) {
        formData.append('file', data.file)
    }

    return request({
        url: '/comment/posts/',
        method: 'POST',
        header: {
            'content-type': 'multipart/form-data'
        },
        data: formData
    })
}

// 更新帖子
export const updatePost = (id, data) => {
    return request({
        url: `/comment/posts/${id}`,
        method: 'PUT',
        data
    })
}

// 删除帖子
export const deletePost = (id) => {
    return request({
        url: `/comment/posts/${id}`,
        method: 'DELETE'
    })
}

// 点赞帖子
export const likePost = (id) => {
    return request({
        url: `/comment/posts/${id}/like`,
        method: 'POST'
    })
}

// 取消点赞
export const unlikePost = (id) => {
    return request({
        url: `/comment/posts/${id}/unlike`,
        method: 'POST'
    })
}

// 评论帖子
export const commentPost = (id, data) => {
    return request({
        url: `/comment/posts/${id}/comments/`,
        method: 'POST',
        data
    })
}

// 获取帖子评论列表 - 已弃用
// 注意：评论数据已包含在帖子详情响应中，不需要单独调用此API
export const getPostComments = (id, params) => {
    console.warn('getPostComments API已弃用，评论数据已包含在帖子详情响应中')
    return request({
        url: `/comment/posts/${id}/comments`,
        method: 'GET',
        data: params
    })
}

// 删除评论
export const deleteComment = (postId, commentId) => {
    return request({
        url: `/comment/comments/${commentId}`,
        method: 'DELETE'
    })
}

// 上传图片
export const uploadImage = (file) => {
    return request({
        url: '/comment/upload/image',
        method: 'POST',
        data: file
    })
}