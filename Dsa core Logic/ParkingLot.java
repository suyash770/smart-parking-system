import java.util.*;

public class ParkingLot {

    private PriorityQueue<ParkingSlot> availableSlots;
    private HashMap<String, ParkingSlot> parkedVehicles;
    private int totalSlots;

    public ParkingLot(int totalSlots) {
        this.totalSlots = totalSlots;
        this.availableSlots = new PriorityQueue<>();
        this.parkedVehicles = new HashMap<>();

        // Initialize slots
        for (int i = 1; i <= totalSlots; i++) {
            availableSlots.add(new ParkingSlot(i));
        }
    }

    // 🚗 Park Vehicle
    public void parkVehicle(Vehicle vehicle) {

        if (availableSlots.isEmpty()) {
            System.out.println("Parking Full!");
            return;
        }

        ParkingSlot slot = availableSlots.poll();
        slot.parkVehicle(vehicle);

        parkedVehicles.put(vehicle.getVehicleNumber(), slot);

        System.out.println("Vehicle parked at slot: " + slot.getSlotNumber());
    }

    // 🚙 Remove Vehicle
    public void removeVehicle(String vehicleNumber) {

        if (!parkedVehicles.containsKey(vehicleNumber)) {
            System.out.println("Vehicle not found!");
            return;
        }

        ParkingSlot slot = parkedVehicles.get(vehicleNumber);
        Vehicle vehicle = slot.getVehicle();

        long exitTime = System.currentTimeMillis();
        long duration = (exitTime - vehicle.getEntryTime()) / 1000; // seconds

        double fee = calculateFee(duration);

        slot.removeVehicle();
        availableSlots.add(slot);
        parkedVehicles.remove(vehicleNumber);

        System.out.println("Vehicle removed from slot: " + slot.getSlotNumber());
        System.out.println("Parking duration: " + duration + " seconds");
        System.out.println("Parking fee: ₹" + fee);
    }

    // 💰 Fee Calculation
    private double calculateFee(long durationInSeconds) {
        double ratePerSecond = 0.5;  // simple pricing
        return durationInSeconds * ratePerSecond;
    }

    // 📊 Show Available Slots
    public void showAvailableSlots() {
        System.out.println("Available Slots: " + availableSlots.size());
    }

    // 🔍 Search Vehicle
    public void searchVehicle(String vehicleNumber) {

        if (parkedVehicles.containsKey(vehicleNumber)) {
            ParkingSlot slot = parkedVehicles.get(vehicleNumber);
            System.out.println("Vehicle found at slot: " + slot.getSlotNumber());
        } else {
            System.out.println("Vehicle not found.");
        }
    }
}
