/*
 * Example showcasing real-time, partial data updates to Polar Heatmap.
 */
const lcjs = require('@lightningchart/lcjs')
const xydata = require('@lightningchart/xydata')
const { lightningChart, Themes, LUT, PalettedFill, regularColorSteps, SolidFill } = lcjs
const { createWaterDropDataGenerator } = xydata

const resolutionSectors = 360
const resolutionAnnuli = 200

const polarChart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        }).Polar({
    legend: { visible: false },
    theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    const smallView = Math.min(window.innerWidth, window.innerHeight) < 500
    if (!window.__lcjsDebugOverlay) {
        window.__lcjsDebugOverlay = document.createElement('div')
        window.__lcjsDebugOverlay.style.cssText = 'position:fixed;top:0;left:0;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;z-index:99999;font:12px monospace;pointer-events:none'
        if (document.body) document.body.appendChild(window.__lcjsDebugOverlay)
        setInterval(() => {
            if (!window.__lcjsDebugOverlay.parentNode && document.body) document.body.appendChild(window.__lcjsDebugOverlay)
            window.__lcjsDebugOverlay.textContent = window.innerWidth + 'x' + window.innerHeight + ' dpr=' + window.devicePixelRatio + ' small=' + (Math.min(window.innerWidth, window.innerHeight) < 500)
        }, 500)
    }
    return t && smallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
})
const polarHeatmap = polarChart
    .addHeatmapSeries({
        sectors: resolutionSectors,
        annuli: resolutionAnnuli,
        amplitudeStart: 0,
        amplitudeStep: 1,
        dataOrder: 'sectors',
    })
    .setVisible(false)

const themeExamples = polarChart.getTheme().examples
if (!themeExamples) {
    throw new Error()
}

const polarSector = polarChart
    .addSector()
    .setAmplitudeStart(0)
    .setAmplitudeEnd(resolutionAnnuli)
    .setStrokeStyle((stroke) => stroke.setFillStyle(new SolidFill({ color: themeExamples.highlightPointColor })))

createWaterDropDataGenerator()
    .setRows(resolutionSectors)
    .setColumns(resolutionAnnuli)
    .generate()
    .then((data) => {
        const palette = new PalettedFill({
            lut: new LUT({
                steps: regularColorSteps(0, 60, themeExamples.intensityColorPalette),
                interpolate: true,
            }),
        })
        polarHeatmap.setFillStyle(palette)
        polarHeatmap.invalidateIntensityValues(data).setVisible(true)
        polarChart.getAmplitudeAxis().fit()

        let iSector = 0
        const frame = () => {
            // --- Partial data update ---
            const updatedVectorValues = []
            for (let i = 0; i < resolutionAnnuli; i += 1) {
                updatedVectorValues[i] = data[iSector][i] + 15 * (Math.random() * 2 - 1)
            }
            polarHeatmap.invalidateIntensityValues({
                iSector,
                iAnnulus: 0,
                values: [updatedVectorValues],
            })

            iSector = (iSector + 1) % resolutionSectors
            polarSector.setAngleStart((360 * iSector) / resolutionSectors).setAngleEnd(polarSector.getAngleStart())
            requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
    })
