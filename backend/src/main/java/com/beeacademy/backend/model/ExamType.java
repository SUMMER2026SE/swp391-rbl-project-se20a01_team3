package com.beeacademy.backend.model;

public enum ExamType {
    MIDTERM_1("Bài giữa kỳ 1", 0),
    FINAL_1("Bài cuối kỳ 1", 1),
    MIDTERM_2("Bài giữa kỳ 2", 2),
    FINAL_2("Bài cuối kỳ 2", 3);

    private final String label;
    private final int slotIndex;

    ExamType(String label, int slotIndex) {
        this.label = label;
        this.slotIndex = slotIndex;
    }

    public String label() {
        return label;
    }

    public int slotIndex() {
        return slotIndex;
    }

    public static ExamType fromSlotIndex(Integer slotIndex) {
        if (slotIndex == null) return null;
        for (ExamType type : values()) {
            if (type.slotIndex == slotIndex) {
                return type;
            }
        }
        return null;
    }

    public static ExamType fromValue(String value) {
        if (value == null) return null;
        for (ExamType type : values()) {
            if (type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        return null;
    }
}
