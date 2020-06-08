package com.moneymaster.controller;

import java.util.NoSuchElementException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

import com.moneymaster.pojo.Response;
import com.moneymaster.pojo.Type;
import com.moneymaster.repository.TypeRepository;

@Controller
@RequestMapping(path = "/moneymaster/type")
public class TypeController {
	@Autowired
	private TypeRepository typeRepository;

	@ResponseStatus(HttpStatus.CREATED)
	@PostMapping(path = "")
	public @ResponseBody Type addNewType(@RequestParam String type) {
		Type n = new Type();
		n.setType(type);
		typeRepository.save(n);
		return n;
	}

	@ResponseStatus(HttpStatus.ACCEPTED)
	@DeleteMapping(path = "{id}")
	public @ResponseBody Response deleteType(@PathVariable Integer id) {
		try {
			typeRepository.deleteById(id);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Type Not Found", e);
		}
		return new Response("Success","DELETE");
	}

	@GetMapping(path = "")
	public @ResponseBody Iterable<Type> getAllTypes() {
		// This returns a JSON or XML with the users
		return typeRepository.findAll();
	}

	@GetMapping(path = "{id}")
	public @ResponseBody Type getType(@PathVariable Integer id) {
		try {
			Optional<Type> n = typeRepository.findById(id);
			return n.get();
		} catch (NoSuchElementException e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Type Not Found", e);
		}
	}

}
