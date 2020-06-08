package com.moneymaster.pojo;

public class Tooltips {
	private String mode;
	private Boolean intersect=false;
	
	public Tooltips(String mode) {
		this.mode=mode;
	}

	public String getMode() {
		return mode;
	}

	public void setMode(String mode) {
		this.mode = mode;
	}

	public Boolean getIntersect() {
		return intersect;
	}

	public void setIntersect(Boolean intersect) {
		this.intersect = intersect;
	}

	@Override
	public String toString() {
		return "Tooltips [mode=" + mode + ", intersect=" + intersect + "]";
	}

}
