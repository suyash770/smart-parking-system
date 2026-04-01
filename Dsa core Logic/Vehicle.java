public class Vehicle {
    private String vehicleNumber;
    private String vehicleType;
    private long entryTime;
    private boolean isVIP;

    public Vehicle(String vehicleNumber, String vehicleType, boolean isVIP) {
        this.vehicleNumber = vehicleNumber;
        this.vehicleType = vehicleType;
        this.isVIP = isVIP;
        this.entryTime = System.currentTimeMillis();
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public long getEntryTime() {
        return entryTime;
    }

    public boolean isVIP() {
        return isVIP;
    }
}
