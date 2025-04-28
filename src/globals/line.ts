import {computed, ref} from 'vue'

export const leftHoverDotPoint = ref(null)

export const rightHoverDotPoint = ref(null)

export const connectorLineStyle = computed(() => {
    if (!leftHoverDotPoint.value || !rightHoverDotPoint.value) return {}

    const { x: x1, y: y1 } = leftHoverDotPoint.value
    const { x: x2, y: y2 } = rightHoverDotPoint.value

    const width = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)

    return {
        position: 'fixed',
        top: `${y1}px`,
        left: `${x1}px`,
        width: `${width}px`,
        height: '2px',
        backgroundColor: 'var(--el-color-primary)',
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'left center',
        zIndex: 9999,
        pointerEvents: 'none',
        transition: 'all 0.2s ease'
    }
})
