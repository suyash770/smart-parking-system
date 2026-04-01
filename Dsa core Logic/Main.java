import java.util.Scanner;

public class Main {

    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter total parking slots: ");
        int totalSlots = scanner.nextInt();

        ParkingLot parkingLot = new ParkingLot(totalSlots);

        while (true) {
            System.out.println("\n1. Park Vehicle");
            System.out.println("2. Remove Vehicle");
            System.out.println("3. Show Available Slots");
            System.out.println("4. Search Vehicle");
            System.out.println("5. Exit");
            System.out.print("Choose option: ");

            int choice = scanner.nextInt();

            switch (choice) {

                case 1:
                    scanner.nextLine();
                    System.out.print("Enter vehicle number: ");
                    String number = scanner.nextLine();

                    System.out.print("Enter vehicle type: ");
                    String type = scanner.nextLine();

                    Vehicle vehicle = new Vehicle(number, type, false);
                    parkingLot.parkVehicle(vehicle);
                    break;

                case 2:
                    scanner.nextLine();
                    System.out.print("Enter vehicle number: ");
                    String removeNumber = scanner.nextLine();
                    parkingLot.removeVehicle(removeNumber);
                    break;

                case 3:
                    parkingLot.showAvailableSlots();
                    break;

                case 4:
                    scanner.nextLine();
                    System.out.print("Enter vehicle number: ");
                    String searchNumber = scanner.nextLine();
                    parkingLot.searchVehicle(searchNumber);
                    break;

                case 5:
                    System.out.println("Exiting...");
                    return;

                default:
                    System.out.println("Invalid choice!");
            }
        }
    }
}
