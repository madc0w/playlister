<template>
	<button
		class="btn"
		:class="[variant, { disabled: disabled }]"
		:disabled="disabled"
		@click="handleClick"
	>
		<slot>{{ label }}</slot>
	</button>
</template>

<script setup>
defineProps({
	label: {
		type: String,
		default: 'Button',
	},
	variant: {
		type: String,
		default: 'primary',
		validator: value => ['primary', 'secondary', 'danger'].includes(value),
	},
	disabled: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['click']);

const handleClick = event => {
	emit('click', event);
};
</script>

<style scoped>
.btn {
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 8px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	outline: none;
}

.btn:hover:not(.disabled) {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active:not(.disabled) {
	transform: translateY(0);
}

.primary {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.secondary {
	background: #6c757d;
	color: white;
}

.danger {
	background: #dc3545;
	color: white;
}

.disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
</style>
