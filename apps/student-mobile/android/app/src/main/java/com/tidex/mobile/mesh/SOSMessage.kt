package com.tidex.mobile.mesh

import org.json.JSONObject

data class SOSMessage(
    val id: String,
    val userId: String,
    val latitude: Double,
    val longitude: Double,
    val timestamp: Long,
    val ttl: Int,
    val delivered: Boolean = false
) {
    fun toJsonString(): String {
        val obj = JSONObject()
        obj.put("id", id)
        obj.put("userId", userId)
        obj.put("latitude", latitude)
        obj.put("longitude", longitude)
        obj.put("timestamp", timestamp)
        obj.put("ttl", ttl)
        obj.put("delivered", delivered)
        return obj.toString()
    }

    companion object {
        fun fromJsonString(raw: String): SOSMessage {
            val obj = JSONObject(raw)
            return SOSMessage(
                id = obj.getString("id"),
                userId = obj.getString("userId"),
                latitude = obj.getDouble("latitude"),
                longitude = obj.getDouble("longitude"),
                timestamp = obj.getLong("timestamp"),
                ttl = obj.getInt("ttl"),
                delivered = obj.optBoolean("delivered", false)
            )
        }
    }
}
