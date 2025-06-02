<template>
	<view>
		<view class="container">
			<router-view></router-view>
		</view>
	</view>
</template>

<script>
export default {
	onLaunch: function () {
		console.log('App Launch')
	},
	onShow: function () {
		console.log('App Show')
	},
	onHide: function () {
		console.log('App Hide')
	}
}
</script>

<style lang="scss">
/*每个页面公共css */
@import 'node_modules/uview-plus/index.scss';
</style>
