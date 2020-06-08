package com.moneymaster.controller;

import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.moneymaster.pojo.Data;
import com.moneymaster.pojo.Dataset;
import com.moneymaster.pojo.Trend;
import com.moneymaster.pojo.Type;
import com.moneymaster.repository.ExpenseRepository;
import com.moneymaster.repository.TypeRepository;

@Controller
@RequestMapping(path = "/moneymaster/trend")
public class TrendController {

	@Autowired
	TypeRepository typeRepository;
	@Autowired
	ExpenseRepository expenseRepository;

	@GetMapping(path = "")
	public @ResponseBody Trend getTrend(@RequestParam String user) {
		String[] colour = { "violet", "indigo", "blue", "green", "yellow", "orange", "red", "black", "brown", "aqua",
				"maroon", "magenta", "grey", "pink" };
		ArrayList<String> labels = new ArrayList<String>();
		ArrayList<Dataset> datasets = new ArrayList<Dataset>();
		Iterable<Type> types = typeRepository.findAll();
		int j = 0;
		for (Type type : types) {
			String label = type.getType();
			Dataset dataset = new Dataset(label, colour[j++]);
			ArrayList<Double> data = new ArrayList<Double>();
			for (int i = 11; i >= 0; --i) {
				SimpleDateFormat format = new SimpleDateFormat("yyyy-MM");
				Calendar cal = Calendar.getInstance();
				cal.add(Calendar.MONTH, -i);
				String date = format.format(cal.getTime());
				DecimalFormat df = new DecimalFormat("#.##");
				Double expense = expenseRepository.findUserTrend(label, user, date);
				expense = Double.valueOf(df.format(expense == null ? 0 : expense));
				data.add(expense);
			}
			dataset.setData(data);
			datasets.add(dataset);
		}
		for (int i = 11; i >= 0; --i) {
			SimpleDateFormat format = new SimpleDateFormat("yyyy-MM");
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.MONTH, -i);
			String label = format.format(cal.getTime());
			labels.add(label);
		}
		Data data = new Data(labels, datasets);
		return new Trend(data);
	}
}
