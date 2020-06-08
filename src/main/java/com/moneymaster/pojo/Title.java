package com.moneymaster.pojo;

public class Title {
	private Boolean display = true;
	private String text = "Expense Trend";

	public Boolean getDisplay() {
		return display;
	}

	public void setDisplay(Boolean display) {
		this.display = display;
	}

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	@Override
	public String toString() {
		return "Title [display=" + display + ", text=" + text + "]";
	}
	
}
