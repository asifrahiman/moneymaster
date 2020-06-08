package com.moneymaster.pojo;

import java.util.ArrayList;

public class Data {
	private ArrayList<String> labels = new ArrayList<String>();
	private ArrayList<Dataset> datasets = new ArrayList<Dataset>();

	public Data(ArrayList<String> labels,ArrayList<Dataset> datasets) {
		this.labels=labels;
		this.datasets=datasets;		
	}

	public ArrayList<String> getLabels() {
		return labels;
	}

	public void setLabels(ArrayList<String> labels) {
		this.labels = labels;
	}

	public ArrayList<Dataset> getDatasets() {
		return datasets;
	}

	public void setDatasets(ArrayList<Dataset> datasets) {
		this.datasets = datasets;
	}

	@Override
	public String toString() {
		return "Data [labels=" + labels + ", datasets=" + datasets + "]";
	}



}
