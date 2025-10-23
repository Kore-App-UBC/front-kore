package com.renatex314.korefront

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableNativeArray
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import com.google.mediapipe.framework.image.MediaImageBuilder

class PoseFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {

    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
        val poseLandmarker = PoseLandmarkerHelper.poseLandmarker ?: return null
        val mpImage = MediaImageBuilder(frame.image).build()

        try {
            val result = poseLandmarker.detectForVideo(mpImage, frame.timestamp)
            val landmarksArray = ArrayList<ArrayList<HashMap<String, Double>>>()

            for (poseLandmarks in result.landmarks()) {
                val poseArray = ArrayList<HashMap<String, Double>>()

                for (landmark in poseLandmarks) {
                    val landmarkMap = hashMapOf(
                        "x" to landmark.x().toDouble(),
                        "y" to landmark.y().toDouble(),
                        "z" to landmark.z().toDouble()
                    )

                    poseArray.add(landmarkMap)
                }

                landmarksArray.add(poseArray)
            }

            return landmarksArray
        } catch (e: Exception) {
            return null
        }
    }
}