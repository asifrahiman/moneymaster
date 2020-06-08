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
import com.moneymaster.pojo.Users;
import com.moneymaster.repository.UserRepository;

@Controller
@RequestMapping(path = "/moneymaster/user")
public class UserController {
	@Autowired
	private UserRepository userRepository;

	@ResponseStatus(HttpStatus.CREATED)
	@PostMapping(path = "")
	public @ResponseBody Users addNewUser(@RequestParam String user) {
		Users n = new Users();
		n.setUser(user);
		userRepository.save(n);
		return n;
	}

	@ResponseStatus(HttpStatus.ACCEPTED)
	@DeleteMapping(path = "{id}")
	public @ResponseBody Response deleteUser(@PathVariable Integer id) {
		try {
			userRepository.deleteById(id);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User Not Found", e);
		}
		return new Response("Success","DELETE");
	}

	@GetMapping(path = "")
	public @ResponseBody Iterable<Users> getAllUsers() {
		// This returns a JSON or XML with the users
		return userRepository.findAll();
	}

	@GetMapping(path = "{id}")
	public @ResponseBody Users getUser(@PathVariable Integer id) {
		try {
			Optional<Users> n = userRepository.findById(id);
			return n.get();
		} catch (NoSuchElementException e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User Not Found", e);
		}
	}

}
