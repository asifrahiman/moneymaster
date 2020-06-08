package com.moneymaster.pojo;

import java.util.HashMap;

public class Download {
	private HashMap<String, Double> summary;
	private Iterable<Expense> expenses;

	public Download(HashMap<String, Double> summary, Iterable<Expense> expenses) {
		this.summary = summary;
		this.expenses = expenses;
	}

	public HashMap<String, Double> getSummary() {
		return summary;
	}

	public void setSummary(HashMap<String, Double> summary) {
		this.summary = summary;
	}

	public Iterable<Expense> getExpenses() {
		return expenses;
	}

	public void setExpenses(Iterable<Expense> expenses) {
		this.expenses = expenses;
	}

	@Override
	public String toString() {
		return "Download [summary=" + summary + ", expenses=" + expenses + "]";
	}

}
